/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {LitElement} from 'lit';
import {CssPartMap, getPartsList} from './parts.js';

// Allow exportparts updating if the host does not have
// a closed shadowRoot.
const canExport = (el: Element) => Boolean(el && el.shadowRoot);

// Strip whitespace and remove empty items.
const cleanExports = (parts: string[]) =>
  parts.map((p) => p.replace(/\s*/g, '')).filter((p) => p);

// Returns an array from an exportpart string, e.g.
// `a, b: c` => [`a`, `b:c`]
const parseExports = (el: Element) =>
  cleanExports((el.getAttribute('exportparts') ?? '').split(/\s*,\s*/g));

const managedExports = new Map();
const pendingEls = new Set();

const nextFrame = () => new Promise(requestAnimationFrame);

let resolveApplyExports = () => {};
let applyExportsPromise: undefined | Promise<void>;
const ensureApplyExportsPending = () => {
  if (applyExportsPromise === undefined) {
    applyExportsPromise = new Promise((resolve) => {
      resolveApplyExports = () => {
        applyExportsPromise = undefined;
        resolve();
      };
    });
  }
};

const exportsApplied = async () => {
  await applyExportsPromise;
};

// Apply exportparts async at RAF so they are only applied once.
const applyExports = async (el: Element) => {
  if (pendingEls.has(el)) {
    return;
  }
  pendingEls.add(el);
  ensureApplyExportsPending();
  await nextFrame();
  pendingEls.delete(el);
  const managed = managedExports.get(el) ?? [];
  const parsed = parseExports(el);
  const exports = new Set([...parsed, ...managed]);
  el.setAttribute('exportparts', Array.from(exports).join());
  if (!pendingEls.size) {
    resolveApplyExports();
  }
};

const addExports = (el: Element, parts: string[]) => {
  let managed = managedExports.get(el);
  if (managed === undefined) {
    managedExports.set(el, (managed = new Set()));
  }
  cleanExports(Array.from(parts)).forEach((p) => managed.add(p));
};

const updateExports = (el: Element, parts: string[] = []) => {
  const host = (el.getRootNode() as ShadowRoot).host!;
  if (!canExport(host)) {
    //console.log(`Cannot set exportparts on ${host.localName}`);
    return;
  }
  addExports(el, parts);
  applyExports(el);
  // Update host as well...
  if (host !== undefined) {
    updateExports(host, parts);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T;

export declare class PartsInterface {
  static parts?: CssPartMap;
  partsApplied(): Promise<void>;
}

/**
 * Mixin which facilitates theming via parts by automatically forwarding parts
 * specified using `define`. This is done by setting the `exportparts`
 * attribute of all containing elements after the element is connected.
 */
export const PartsMixin = <T extends Constructor<LitElement>>(
  Base: T,
  queryParts = false
) => {
  class PartsElement extends Base {
    static parts?: CssPartMap;

    _partsPromise?: Promise<void>;

    override connectedCallback() {
      super.connectedCallback();
      this._partsPromise = this.applyParts();
    }

    async applyParts() {
      const parts = (this.constructor as typeof PartsElement).parts;
      if (parts === undefined && !queryParts) {
        return;
      }
      await this.updateComplete;
      const exports = queryParts
        ? (Array.from(
            ((this.renderRoot ?? this) as Element).querySelectorAll('[part]')
          )
            .map((e: Element) => e.getAttribute('part')!.split(/\s+/g))
            .filter((p) => p)
            .flat(Infinity) as string[])
        : getPartsList(parts!);
      updateExports(this, exports);
      await exportsApplied();
    }

    async partsApplied() {
      await this._partsPromise;
    }
  }
  return PartsElement as Constructor<PartsInterface> & T;
};
