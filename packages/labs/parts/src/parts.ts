/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {
  directive,
  Directive,
  DirectiveParameters,
  ElementPart,
} from 'lit/directive.js';
import {noChange} from 'lit';
import {unsafeCSS, CSSResultGroup} from 'lit';

const USE_COMPRESSION = true;
const PART_SEPARATOR = '_';
const COMPRESS_START = 'p';

type CssPartDefList = Array<string | CssPartDef>;
type CssPartDef = [string, CssPart | CssPartMap];

/**
 * Type for object with `CssPart` values keyed by part names provided via
 * `defineParts`.
 */
export interface CssPartMap {
  [index: string]: CssPart;
}

/**
 * Options argument type for CssPart.
 */
export type CssPartConfig = {
  key?: string;
  namespace?: string;
  exp?: string;
  separator?: string;
  parts?: CssPartMap | CssPartDefList;
};

/**
 * Describes a css parts. Typically this is not used by itself.
 * The parts produced by `defineParts` are `CssPart` objects.
 */
export class CssPart {
  key: string;
  namespace: string;
  part: string;
  export: string;
  $: CssPartMap;
  separator: string;

  css: CSSResultGroup;
  def: CSSResultGroup;
  attr;

  constructor(
    {
      key = '',
      namespace = '',
      exp = '',
      separator = PART_SEPARATOR,
      parts: partsConfig = undefined,
    }: CssPartConfig = {
      key: '',
      namespace: '',
      exp: '',
      separator: PART_SEPARATOR,
      parts: undefined,
    }
  ) {
    this.key = key;
    this.namespace = namespace;
    this.export = exp;
    this.separator = separator;
    this.part = getPartString(
      strList(this.namespace, this.key, this.export).join(this.separator)
    );
    this.css = unsafeCSS(`::part(${this.part})`);
    this.def = unsafeCSS(`[part~=${this.part}]`);
    this.$ = partsConfig !== undefined ? this.importParts(partsConfig) : {};
    this.attr = litCssPart(this);
  }

  /** Note, input is either:
   *  1. an array of the form: ['a', ['b', partOrParts (CssPart|CssPartMap)]]
   *  2. a map of parts: {a: CssPart, ...}. This is transformed to an array of
   *  [['a', CssPart], ...]
   */
  private importParts(config: CssPartMap | CssPartDefList) {
    const imports: CssPartMap = {};
    const list = Array.isArray(config) ? config : Object.entries(config);
    list.forEach((config) => {
      const [key, partOrParts] = Array.isArray(config) ? config : [config];
      const partInfoConfig = this.importConfig(key, partOrParts);
      imports[key] = new CssPart(partInfoConfig);
    });
    return imports;
  }

  private importConfig(key = '', partOrParts?: CssPart | CssPartMap) {
    const isCssPart = partOrParts instanceof CssPart;
    const namespace = this.namespace;
    key = isCssPart ? this.key : key;
    const exp = isCssPart ? partOrParts.part : '';
    const parts = isCssPart ? partOrParts.$ : partOrParts;
    return {namespace, key, exp, parts};
  }

  getExportParts(): string {
    const exp = this.export ? strList(this.export, this.part).join(':') : '';
    const sub = Object.values(this.$).reduce(
      (a, v) => strList(a, v.getExportParts()).join(),
      ''
    );
    return strList(exp, sub).join();
  }

  getPartsList(): string[] {
    const parts = Object.values(this.$).flatMap((p) => p.getPartsList());
    return [this.part, ...parts];
  }

  toString() {
    return this.part;
  }
}

/**
 * Defines a set of css parts using the array of names and the given namespace.
 * If a namespace is provided, names are separated from it with a `_`.
 * Produces a `Parts` object with keys matching the given names. For example,
 *
 * ```
 *   defineParts([
 *     'a', b', c',
 *     ['first', MyElement.parts],
 *     ['second', MyElement.parts],
 *   ], 'Export1');
 */
export const defineParts = (
  parts: Array<string | CssPartDef>,
  namespace = ''
) => new CssPart({parts, namespace}).$;

/* ********************* DIRECTIVE ********************* */
class CssPartDirective extends Directive {
  hasUpdated = false;

  render(..._info: Array<string | CssPart>) {}

  override update(part: ElementPart, [...infos]: DirectiveParameters<this>) {
    if (!this.hasUpdated) {
      const el = part.element;
      this.hasUpdated = true;
      const parts: string[] = [el.getAttribute('part') ?? ''];
      const exportParts: string[] = [el.getAttribute('exportparts') ?? ''];
      infos.forEach((info) => {
        parts.push((info as CssPart)?.part ?? info);
        exportParts.push((info as CssPart).getExportParts?.() ?? '');
      });
      el.setAttribute('part', parts.filter((x) => x).join(' '));
      el.setAttribute('exportparts', exportParts.filter((x) => x).join(','));
    }
    return noChange;
  }
}

/**
 * Lit element part directive for specifying a css part specified via the
 * provided `defineParts` API.
 *
 * Note, this is available via the CssPart class' `attr` property.
 *
 * Example of standalone use:
 *
 * ```
 *   const parts = defineParts(['header'], 'my-element');
 *   html`<div ${litCssPart(parts.header)}>Header</div>`
 * ```
 *
 */
const litCssPart = directive(CssPartDirective);

/* ********************* UTILITIES ********************* */
let guid = 0;
const cache: Map<string, string> = new Map();
export const getPartString = USE_COMPRESSION
  ? (s: string, c = '') =>
      cache.get(s) ?? (cache.set(s, (c = `${COMPRESS_START}${++guid}`)), c)
  : (s: string) => s;

const strList = (...args: string[]) => args.filter((x) => x !== '');

export const getPartsList = (parts: CssPartMap): string[] =>
  Object.values(parts!).flatMap((p) => p.getPartsList());

/**
 * Returns a <style> using the provided template string.
 * The values of the string may be `CssPart` objects. If so, their `css`
 * property is used, which provides a selector of the form `::part(name)`.
 * For example,
 *
 * ```
 * const style = partStyle`
 *   ${MyElement.parts.header} {
 *     font-size: 4rem;
 *   }
 * `;
 * ```
 */
export const partStyle = (
  strings: TemplateStringsArray,
  ...values: Array<CssPart>
) => {
  const el = document.createElement('style');
  const css = strings.reduce(
    (a, s, i) => `${a}${s}${values[i]?.css || ''}`,
    ''
  );
  el.textContent = css;
  return el;
};
