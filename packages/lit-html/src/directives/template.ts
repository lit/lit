/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  type CompiledTemplateResult,
  type ChildPart,
  noChange,
  nothing,
  render,
  type MaybeCompiledTemplateResult,
  type UncompiledTemplateResult,
} from '../lit-html.js';
import {directive, Directive, PartInfo, PartType} from '../directive.js';
import {isServer} from '../is-server.js';
import {_$LH} from '../private-ssr-support.js';

const {EventPart, PropertyPart, marker, markerMatch} = _$LH;

const brand = Symbol.for('lit-template-value');

export type TemplateValue = {
  ['_$litTemplateValue$']: MaybeCompiledTemplateResult;
  r: typeof brand;
};

export const isTemplateValue = (value: unknown): value is TemplateValue =>
  (value as Partial<TemplateValue>)?.r === brand;

export const getTemplateValue = (value: TemplateValue) =>
  value['_$litTemplateValue$'];

const isUncompiledTemplateResult = (
  value: unknown
): value is MaybeCompiledTemplateResult =>
  typeof (value as {['_$litType$']?: unknown})?.['_$litType$'] === 'number' &&
  Array.isArray((value as {strings?: unknown}).strings) &&
  Array.isArray((value as {values?: unknown}).values);

const isCompiledTemplateResult = (
  value: unknown
): value is MaybeCompiledTemplateResult =>
  (value as {['_$litType$']?: {h?: unknown}})?.['_$litType$']?.h !==
    undefined && Array.isArray((value as {values?: unknown}).values);

const isMaybeCompiledTemplateResult = (
  value: unknown
): value is MaybeCompiledTemplateResult =>
  isUncompiledTemplateResult(value) || isCompiledTemplateResult(value);

const ensureTemplateResult = (value: unknown): MaybeCompiledTemplateResult => {
  if (!isMaybeCompiledTemplateResult(value)) {
    throw new Error('template() called with a non-TemplateResult value');
  }
  return value;
};

type TemplatePartRecord =
  | {
      type: number;
      index: number;
    }
  | {
      type: number;
      index: number;
      name: string;
      strings: ReadonlyArray<string>;
      ctor: typeof EventPart | typeof PropertyPart | Function;
    };

type TemplateShape = {
  el: HTMLTemplateElement;
  parts: ReadonlyArray<TemplatePartRecord>;
};

const CHILD_TEMPLATE_PART = 2;
const COMMENT_TEMPLATE_PART = 7;

const getCompiledTemplate = (result: CompiledTemplateResult): TemplateShape => {
  const template = result['_$litType$'];
  if (template.el === undefined) {
    const el = document.createElement('template');
    el.innerHTML = template.h[0] as unknown as string;
    template.el = el;
  }
  return template as unknown as TemplateShape;
};

const getTemplateShape = (
  result: MaybeCompiledTemplateResult,
  part: ChildPart
): TemplateShape =>
  isCompiledTemplateResult(result)
    ? getCompiledTemplate(result as CompiledTemplateResult)
    : (
        part as ChildPart & {
          _$getTemplate(result: UncompiledTemplateResult): TemplateShape;
        }
      )._$getTemplate(result as UncompiledTemplateResult);

const getNodeByIndex = (fragment: DocumentFragment) => {
  const nodes = new Map<number, Node>();
  const walker = document.createTreeWalker(
    fragment,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT
  );
  let nodeIndex = 0;
  let node: Node | null;
  while ((node = walker.nextNode()) !== null) {
    nodes.set(nodeIndex, node);
    nodeIndex++;
  }
  return nodes;
};

const hasSingleExpression = (strings: ReadonlyArray<string>) =>
  strings.length === 2 && strings[0] === '' && strings[1] === '';

const supportsClonablePropertyBinding = (
  sourceElement: Element,
  name: string,
  value: unknown
) => {
  if (sourceElement.localName.includes('-')) {
    return false;
  }
  if (
    typeof value === 'function' ||
    typeof value === 'symbol' ||
    typeof value === 'bigint' ||
    (typeof value === 'object' && value !== null)
  ) {
    return false;
  }
  const probe = sourceElement.cloneNode(false) as Element;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (probe as any)[name] = value === nothing ? undefined : value;
    const clone = probe.cloneNode(true) as Element;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.is((clone as any)[name], (probe as any)[name]);
  } catch {
    return false;
  }
};

const prepareClientTemplateResult = (
  result: MaybeCompiledTemplateResult,
  part: ChildPart
): MaybeCompiledTemplateResult => {
  const template = getTemplateShape(result, part);
  const nodes = getNodeByIndex(template.el.content);
  const values = [...result.values];
  let valueIndex = 0;
  let hasRewrites = false;

  for (const templatePart of template.parts) {
    if ('strings' in templatePart) {
      const consumed = templatePart.strings.length - 1;
      if (templatePart.ctor === EventPart) {
        for (let i = 0; i < consumed; i++) {
          values[valueIndex + i] = nothing;
        }
        hasRewrites = true;
      } else if (templatePart.ctor === PropertyPart) {
        const element = nodes.get(templatePart.index);
        if (
          !(element instanceof Element) ||
          !hasSingleExpression(templatePart.strings) ||
          !supportsClonablePropertyBinding(
            element,
            templatePart.name,
            values[valueIndex]
          )
        ) {
          // Only keep property bindings whose state survives cloneNode(true).
          throw new Error(
            `template() only supports clone-stable property bindings on native elements. Unsupported binding: .${templatePart.name} on <${
              element instanceof Element ? element.localName : 'unknown'
            }>`
          );
        }
      }
      valueIndex += consumed;
    } else {
      if (templatePart.type === PartType.ELEMENT) {
        values[valueIndex] = nothing;
        hasRewrites = true;
      }
      valueIndex++;
    }
  }

  return hasRewrites ? {...result, values} : result;
};

const stripRootRenderMarker = (
  fragment: DocumentFragment,
  rootPart: ChildPart
) => {
  const markerNode = rootPart.startNode;
  if (markerNode instanceof Comment && markerNode.parentNode === fragment) {
    markerNode.remove();
  }
};

const sanitizeMarkerComments = (
  fragment: DocumentFragment,
  template: TemplateShape,
  rootPart: ChildPart
) => {
  // render() always inserts a root marker into the fragment before any content.
  stripRootRenderMarker(fragment, rootPart);
  const nodes = getNodeByIndex(fragment);
  const commentsToRemove: Comment[] = [];
  for (const templatePart of template.parts) {
    const node = nodes.get(templatePart.index);
    if (!(node instanceof Comment) || 'strings' in templatePart) {
      continue;
    }
    if (
      templatePart.type === CHILD_TEMPLATE_PART &&
      (node.data === '' || node.data === '?' || node.data === markerMatch)
    ) {
      commentsToRemove.push(node);
    } else if (templatePart.type === COMMENT_TEMPLATE_PART) {
      // Scrub marker text only on known comment parts, not authored comments.
      node.data = node.data.split(marker).join('');
    }
  }
  for (const comment of commentsToRemove) {
    comment.remove();
  }
};

class TemplateDirective extends Directive {
  static directiveName = 'template';
  private _template?: HTMLTemplateElement;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.CHILD) {
      throw new Error('template() can only be used in child bindings');
    }
  }

  render(
    result:
      | MaybeCompiledTemplateResult
      | typeof nothing
      | typeof noChange
      | undefined
      | null
  ) {
    if (result === nothing || result == null || result === noChange) {
      return result;
    }
    result = ensureTemplateResult(result);
    if (isServer) {
      return {
        ['_$litTemplateValue$']: result,
        r: brand,
      } satisfies TemplateValue;
    }
    return noChange;
  }

  override update(
    part: ChildPart,
    [result]: [
      | MaybeCompiledTemplateResult
      | typeof nothing
      | typeof noChange
      | undefined
      | null,
    ]
  ) {
    if (result === nothing || result == null || result === noChange) {
      this._template = undefined;
      return result;
    }
    result = ensureTemplateResult(result);
    result = prepareClientTemplateResult(result, part);
    if (this._template !== undefined) {
      return this._template;
    }
    const template = document.createElement('template');
    const rootPart = render(result, template.content, {
      ...part.options,
      isConnected: false,
    }) as ChildPart;
    sanitizeMarkerComments(
      template.content,
      getTemplateShape(result, part),
      rootPart
    );
    this._template = template;
    return template;
  }
}

/**
 * Renders a `TemplateResult` into an inert `<template>` element.
 *
 * The contents are rendered once and then treated as static. Subsequent
 * updates return the same `<template>` element.
 *
 * This directive only creates an inert `HTMLTemplateElement`. Outer template
 * attributes are intentionally out of scope for this prototype.
 *
 * In particular, this directive does not activate declarative shadow DOM,
 * whose `shadowrootmode` attribute only takes effect when parsed from HTML.
 */
export const template = directive(TemplateDirective);

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type {TemplateDirective};
