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

import {nothing, _$LH, render, RootPart} from '../lit-html.js';
import {directive, AsyncDirective} from '../async-directive.js';
import {DirectiveParameters, PartType} from '../directive.js';
import {insertPart} from '../directive-helpers.js';
import {
  ElementPartProcessors,
  getHostSlots as baseGetHostSlots,
  litSlotKey,
  attachShadow,
  getLogicalNodes,
} from '../polyfill-support-lite.js';

export {flush} from '../polyfill-support-lite.js';

const {_ChildPart: ChildPart, _TemplateInstance: TemplateInstance} = _$LH;
type ChildPart = InstanceType<typeof ChildPart>;
type TemplateInstance = InstanceType<typeof TemplateInstance>;

const createMarker = (c = '') => document.createComment(c);

export const renderLitShadow = (
  value: unknown,
  host: HTMLElement
): RootPart => {
  return render(value, attachShadow(host), {host});
};

export const getHostSlots = baseGetHostSlots as (
  host: HTMLElement
) => Set<LitSlotDirective>;

export class LitSlotDirective extends AsyncDirective {
  host?: HTMLElement;

  slotEl?: HTMLSlotElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slotPart: any;

  name = '';

  slot = '';

  fallback?: unknown;

  private _assignedNodes: Node[] = [];

  render(_config?: {slot?: string; name?: string; fallback?: unknown}) {
    return nothing;
  }

  override update(
    // ChildPart is private
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
          (part as any)[litSlotKey] = this;
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
          (this.slotPart as any)[litSlotKey] = this;
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
