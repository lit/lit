/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * A lightweight custom element implementation as an element directive.
 * Note, this is automatically integrated into the `polyfill-support-lite`
 * module.
 *
 * @packageDocumentation
 */

import {nothing, RootPart, _$LH} from '../lit-html.js';
import {directive, AsyncDirective} from '../async-directive.js';
import {DirectiveParameters, PartType} from '../directive.js';
import {insertPart} from '../directive-helpers.js';
import {
  ElementPartProcessors,
  litShadowKey,
  litChildPartKey,
  getPartNodes,
  ShadowChildPart,
} from '../polyfill-support-lite.js';

const {_ChildPart: ChildPart, _TemplateInstance: TemplateInstance} = _$LH;
type ChildPart = InstanceType<typeof ChildPart>;
type TemplateInstance = InstanceType<typeof TemplateInstance>;

/**
 * TODOs and Issues
 *
 * Issue: a node can be added to one part without being removed
 * from another:
 *  1. setValue nodes [A, B]
 *  2. setValue nodes [B, A]
 *  3. Here B is inserted to part 1 without clearing from part 2. When A is
 *  added to part 2, B is cleared from it. If this removes B from DOM, B
 *  is in the wrong spot.
 *
 * Issue: for shadow projection, a node must be able to virtually be in its
 * logical part but physically be in its projected part. IOW, we always need
 * the list of logical nodes (host children) to be accurate despite the nodes
 * physical location (inside the parent of their slot).
 *
 * Issue: need to know when to distribute. The approach here uses a DOM
 * childList MO, but if Lit nodes have been distributed, they can be
 * updated in place without causing a host childList mutation but in a way
 * that needs distribution. To deal with this we could hook
 * `ChildPart._$setValue` and do distribution if the part's `parentNode` is a
 * `host.`
 *
 * Issue: Tracking nodes may be $$ and is intrusive to Lit. Could do this
 * only for shadow hosts and maybe just their light content (but this might
 * require using `compareDocumentPosition` to determine if we're after the
 * shadow end node and that might be ok or not), and could do this by hooking
 * `ChildPart._$insert` and `ChildPart._$clear`.
 *
 * Issue: Currently this directive is opt-in, but it would be nice to use via
 * `<slot></slot>`. This would likely require (1) removing  the <slot> in the
 * template, but maintaining it so read parts set on its slot/name attributes
 * and it fallback content, (2) replacing it with a pre-valued part containing
 * a slot directive.
 */

const createMarker = (c = '') => document.createComment(c);

export const renderLitShadow = (
  value: unknown,
  host: HTMLElement
): RootPart => {
  // This property needs to remain unminified.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let shadowPart: ChildPart = (host as any)[litShadowKey];
  if (shadowPart === undefined) {
    const endNode = createMarker('lit-shadow-]');
    host.insertBefore(endNode, host.firstChild);
    const startNode = createMarker('lit-shadow-[');
    host.insertBefore(startNode, host.firstChild);
    // This property needs to remain unminified.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (host as any)[litShadowKey] = shadowPart = new ChildPart(
      startNode,
      endNode,
      undefined, // parent
      {host}
    );
    distributeOnDomMutation(host);
  }
  shadowPart._$setValue(value);
  finishDistribution(host);
  return shadowPart as RootPart;
};

const finishDistribution = (host: HTMLElement) => {
  // remove undistributed nodes
  const nodes = getLogicalNodes(host);
  // console.log('finishDistribution', nodes);
  nodes.forEach((n) => {
    if (n.parentNode === host) {
      host.removeChild(n);
    }
  });
  // We've dealt with everything so discard any pending mutations.
  observerMap.get(host)?.takeRecords();
};

export const flush = () => {
  for (const [host, observer] of observerMap) {
    // clear pending changes.
    // Note, it would be nice to distribute only if there are mutation records;
    // however, distributed nodes may not be in this physical location.
    observer.takeRecords();
    distribute(host);
  }
};

const observerMap = new Map<HTMLElement, MutationObserver>();
const distributeOnDomMutation = (host: HTMLElement) => {
  const observer = new MutationObserver(() => {
    distribute(host);
  });
  observer.observe(host, {childList: true});
  observerMap.set(host, observer);
};

const distribute = (host: HTMLElement) => {
  const slots = getHostSlots(host);
  for (const s of slots) {
    s.distribute();
  }
  finishDistribution(host);
};

// Note, we do not distribute comment nodes.
const nodeMatchesSlot = (n: Node, name = '') =>
  (n.nodeType === Node.ELEMENT_NODE
    ? (n as Element).getAttribute('slot') ?? ''
    : n.nodeType !== Node.COMMENT_NODE && '') === name;

export const getLogicalNodes = (
  host: HTMLElement,
  slotName?: string | undefined
) => {
  const childNodes: Node[] = [];
  const start =
    // This property needs to remain un-minified.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (host as any)[litShadowKey]?.endNode!.nextSibling ??
    (host.localName === 'slot' ? host.firstChild : null);
  if (start === null) {
    return childNodes;
  }
  let skipTo: Node | undefined = undefined;
  let lightPart: ChildPart | undefined;
  // Record nodes starting after the shadow end node minus lit part marker.
  // This allows parts to continue to function in the same location.
  // For part markers add the nodes inserted in the part, which may not
  // physically be there if they've been distributed to a `litSlot`.
  for (let n: ChildNode | null = start; n; n = n.nextSibling) {
    if (skipTo !== undefined) {
      if (n === skipTo) {
        skipTo = undefined;
      }
      continue;
    }
    if (n.nodeType !== Node.COMMENT_NODE) {
      if (slotName === undefined || nodeMatchesSlot(n, slotName)) {
        childNodes.push(n);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if ((lightPart = (n as any)[litChildPartKey]) !== undefined) {
      // Filter by slot name if it's set.
      let litSlot: LitSlotDirective | undefined;
      if (
        slotName !== undefined &&
        (litSlot = getPartSlotDirective(lightPart)) !== undefined
      ) {
        if (slotName === litSlot.slot) {
          childNodes.push(...litSlot.assignedNodes());
        }
        skipTo = lightPart._$endNode!;
      } else {
        const partNodes = getPartNodes(lightPart as unknown as ShadowChildPart);
        childNodes.push(
          ...(partNodes.filter(
            (x) =>
              (slotName === undefined && x.nodeType !== Node.COMMENT_NODE) ||
              nodeMatchesSlot(x, slotName)
          ) ?? [])
        );
        skipTo = partNodes[partNodes.length - 1];
      }
    }
  }
  return childNodes;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPartSlotDirective = ({_$litSlotDirective: slot}: any) =>
  slot !== undefined && slot instanceof LitSlotDirective ? slot : undefined;

const slotMap = new WeakMap<HTMLElement, Set<LitSlotDirective>>();

// exported for testing only.
export const getHostSlots = (host: HTMLElement) => {
  let slots = slotMap.get(host);
  if (slots === undefined) {
    slotMap.set(host, (slots = new Set()));
  }
  return slots;
};

export class LitSlotDirective extends AsyncDirective {
  host?: HTMLElement;

  slotEl?: HTMLSlotElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slotPart: any;

  name = '';

  // TODO: slot to which this should distribute (WIP)
  slot = '';

  fallback?: unknown;

  private _assignedNodes: Node[] = [];

  render(_config?: {slot?: string; name?: string; fallback?: unknown}) {
    return nothing;
  }

  override update(
    // ChildPart is private =(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    part: any,
    [config]: DirectiveParameters<this>
  ) {
    const {slot, name, fallback} = config ?? {};
    this.host ??= part.options?.host as HTMLElement;
    if (this.host !== undefined) {
      if (this.slotPart === undefined) {
        if (part.type === PartType.CHILD) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (part as any)._$litSlotDirective = this;
          this.slotPart = insertPart(part, undefined);
        } else if (part.element.localName === 'slot') {
          this.slotEl = part.element;
          const start = createMarker();
          const end = createMarker();
          this.slotEl!.parentNode!.replaceChild(end, this.slotEl!);
          end.parentNode!.insertBefore(start, end);
          this.slotPart = new ChildPart(
            start,
            end,
            this._$parent as TemplateInstance,
            part.options
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.slotPart as any)._$litSlotDirective = this;
        }
        getHostSlots(this.host).add(this);
      }
      this.slot = slot || this.slotEl?.getAttribute('slot') || '';
      this.name = name || this.slotEl?.getAttribute('name') || '';
      this.fallback = fallback;
      this.distribute();
    }
    return this.render({slot, name, fallback});
  }

  override disconnected() {
    super.disconnected();
    // undistribute?
    getHostSlots(this.host!).delete(this);
  }

  override reconnected() {
    super.reconnected();
    // distribute?
    getHostSlots(this.host!).add(this);
  }

  distribute() {
    const slotted = getLogicalNodes(this.host!, this.name).slice();
    const hasSlottedNodes = slotted.length > 0;
    // console.log(this.name, 'in host', this.host, 'slotted', slotted);
    const fallback =
      this.fallback ?? (this.slotEl ? getLogicalNodes(this.slotEl) : undefined);
    this.slotPart._$setValue(hasSlottedNodes ? slotted : fallback);
    // Note, with re-distribution physical nodes might not be correct.
    this._assignedNodes = hasSlottedNodes
      ? slotted
      : getPhysicalNodes(this.slotPart);
  }

  assignedNodes() {
    return this._assignedNodes.slice();
  }

  assignedElements() {
    return this._assignedNodes?.filter((n) => n.nodeType === 1);
  }
}

const getPhysicalNodes = (part: ChildPart) => {
  const nodes = [];
  const {_$startNode: start, _$endNode: end} = part;
  for (let n = start.nextSibling; n && n !== end; n = n.nextSibling) {
    // let's just exclude comments
    if (n.nodeType !== Node.COMMENT_NODE) {
      nodes.push(n);
    }
  }
  return nodes;
};

/**
 * Directive for managing a shimmed custom elements that
 * works on browsers without native custom elements by leveraging Lit
 * to manage the element's lifecycle.
 */
export const litSlot = directive(LitSlotDirective);

ElementPartProcessors.add((el: Element) =>
  el.localName === 'slot' ? litSlot() : undefined
);
