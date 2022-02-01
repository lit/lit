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
import {DirectiveParameters} from '../directive.js';
import {insertPart} from '../directive-helpers.js';

const litShadowKey = '_$litShadowPart$';

const {_ChildPart: ChildPart} = _$LH;
type ChildPart = InstanceType<typeof ChildPart>;

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
  removeUndistributedNodes(host);
  // We've dealt with everything so discard any pending mutations.
  observerMap.get(host)?.takeRecords();
  return shadowPart as RootPart;
};

const removeUndistributedNodes = (host: HTMLElement) => {
  getLightChildNodes(host, true).forEach((n) => {
    if (n.parentNode === host) {
      host.removeChild(n);
    }
  });
};

export const flush = () => {
  for (const [host, observer] of observerMap) {
    if (observer.takeRecords().length) {
      distribute(host);
    }
  }
};

const observerMap = new Map<HTMLElement, MutationObserver>();
const distributeOnDomMutation = (host: HTMLElement) => {
  const observer = new MutationObserver(() => distribute(host));
  observer.observe(host, {childList: true});
  observerMap.set(host, observer);
};

const distribute = (host: HTMLElement) => {
  const slots = getSlots(host);
  for (const s of slots) {
    s.distribute();
  }
  removeUndistributedNodes(host);
};

const childNodesMap = new WeakMap<ChildPart, Node[]>();

export const getLightChildNodes = (host: HTMLElement, validate = false) => {
  let childNodes: Node[] | undefined;
  // This property needs to remain unminified.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shadowPart: ChildPart = (host as any)[litShadowKey];
  if (shadowPart !== undefined) {
    childNodes = childNodesMap.get(shadowPart);
    if (childNodes === undefined) {
      childNodesMap.set(shadowPart, (childNodes = []));
    }
    if (validate) {
      childNodes.length = 0;
      let skipTo: Node | undefined = undefined;
      let lightPart: ChildPart | undefined;
      // Record nodes starting after the shadow end node minus lit part marker.
      // This allows parts to continue to function in the same location.
      // For part markers add the nodes inserted in the part, which may not
      // physically be there if they've been distributed to a `litSlot`.
      for (let n = shadowPart.endNode!.nextSibling; n; n = n.nextSibling) {
        if (skipTo !== undefined) {
          if (n === skipTo) {
            skipTo = undefined;
          }
          continue;
        }
        if (n.nodeType !== Node.COMMENT_NODE) {
          childNodes.push(n);
        } else if ((lightPart = shadowPart._$partForNode(n)) !== undefined) {
          childNodes.push(
            ...(lightPart
              ._$getInsertedNodes(true)
              .filter((x) => x.nodeType !== Node.COMMENT_NODE) ?? [])
          );
          skipTo = lightPart._$getLastInsertedNode();
        }
      }
    }
  }
  return childNodes ?? [];
};

const slotMap = new WeakMap<HTMLElement, Set<LitSlotDirective>>();
const getSlots = (host: HTMLElement) => {
  let slots = slotMap.get(host);
  if (slots === undefined) {
    slotMap.set(host, (slots = new Set()));
  }
  return slots;
};

export class LitSlotDirective extends AsyncDirective {
  host?: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slotPart: any;

  // TODO: slot to which this should distribute (WIP)
  name = '';

  slot = '';

  render(_slot = '') {
    return nothing;
  }

  // ChildPart is private =(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override update(part: any, [slot = '']: DirectiveParameters<this>) {
    this.host ??= part.options?.host as HTMLElement;
    if (this.host !== undefined) {
      if (this.slotPart === undefined) {
        this.slotPart = insertPart(part, undefined);
        getSlots(this.host).add(this);
      }
      this.slot = slot;
      this.distribute();
    }
    return this.render(slot);
  }

  override disconnected() {
    super.disconnected();
    // undistribute?
    getSlots(this.host!).delete(this);
  }

  override reconnected() {
    super.reconnected();
    // distribute?
    getSlots(this.host!).add(this);
  }

  distribute() {
    const slotted = getLightChildNodes(this.host!, true).filter(
      (n: Node) =>
        (n.nodeType === Node.ELEMENT_NODE
          ? (n as Element).getAttribute('slot') ?? ''
          : '') === this.slot
    );
    this.slotPart._$setValue(slotted);
  }
}

/**
 * Directive for managing a shimmed custom elements that
 * works on browsers without native custom elements by leveraging Lit
 * to manage the element's lifecycle.
 */
export const litSlot = directive(LitSlotDirective);

// ElementPartProcessors.add((el: Element) =>
//   el.localName === 'slot' ? litSlot() : undefined
// );
