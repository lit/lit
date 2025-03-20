/// <reference lib="dom" />

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {TemplateResult, ChildPart, CompiledTemplateResult} from 'lit';
import type {Directive} from 'lit/directive.js';

import {nothing, noChange} from 'lit';
import {PartType} from 'lit/directive.js';
import {
  isPrimitive,
  isTemplateResult,
  getDirectiveClass,
  TemplateResultType,
  isCompiledTemplateResult,
} from 'lit/directive-helpers.js';
import {_$LH} from 'lit-html/private-ssr-support.js';

const {
  getTemplateHtml,
  marker,
  markerMatch,
  boundAttributeSuffix,
  patchDirectiveResolve,
  getAttributePartCommittedValue,
  resolveDirective,
  AttributePart,
  PropertyPart,
  BooleanAttributePart,
  EventPart,
  connectedDisconnectable,
  isIterable,
} = _$LH;

import {digestForTemplateResult} from '@lit-labs/ssr-client';
import {HTMLElement, HTMLElementWithEventMeta} from '@lit-labs/ssr-dom-shim';

import {
  ElementRenderer,
  ElementRendererConstructor,
  getElementRenderer,
} from './element-renderer.js';

import {escapeHtml} from './util/escape-html.js';

import {parseFragment, parse} from 'parse5';
import {
  isElementNode,
  isCommentNode,
  traverse,
  isTextNode,
  isTemplateNode,
  Template,
  Element,
} from '@parse5/tools';

import {isRenderLightDirective} from '@lit-labs/ssr-client/directives/render-light.js';
import {reflectedAttributeName} from './reflected-attributes.js';

import type {RenderResult} from './render-result.js';
import {isHydratable} from './server-template.js';
import type {Part} from 'lit-html';

declare module 'parse5/dist/tree-adapters/default.js' {
  interface Element {
    isDefinedCustomElement?: boolean;
  }
}

function ssrResolve(this: Directive, _part: Part, values: unknown[]) {
  // Since the return value may also be a directive result in the case of nested
  // directives, we may need to patch that as well.
  return patchIfDirective(this.render(...values));
}

/**
 * Looks for values of type `DirectiveResult` and patches its Directive class
 * such that it calls `render` rather than `update`.
 */
const patchIfDirective = (value: unknown) => {
  const directiveCtor = getDirectiveClass(value);
  if (directiveCtor !== undefined) {
    patchDirectiveResolve(directiveCtor, ssrResolve);
  }
  return value;
};

/**
 * Patches `DirectiveResult` `Directive` classes for AttributePart values, which
 * may be an array
 */
const patchAnyDirectives = (
  part: InstanceType<typeof AttributePart>,
  value: unknown,
  valueIndex: number
) => {
  if (part.strings !== undefined) {
    for (let i = 0; i < part.strings.length - 1; i++) {
      patchIfDirective((value as unknown[])[valueIndex + i]);
    }
  } else {
    patchIfDirective(value);
  }
};

const templateCache = new WeakMap<TemplateStringsArray, Array<Op>>();

// This is a map for which slots exist for a given custom element.
// With a named slot, it is represented as a string with the name
// and the unnamed slot is represented as undefined.
const elementSlotMap = new WeakMap<
  HTMLElement,
  Map<string | undefined, HTMLSlotElement>
>();

// We want the slot element to be able to be identified.
class HTMLSlotElement extends HTMLElement {
  name!: string;
  override get localName(): string {
    return 'slot';
  }
}

/**
 * Operation to output static text
 */
type TextOp = {
  type: 'text';
  value: string;
};

/**
 * Operation to output dynamic text from the associated template result value
 */
type ChildPartOp = {
  type: 'child-part';
  index: number;
  useCustomElementInstance?: boolean;
};

/**
 * Operation to output an attribute with bindings. Includes all bindings for an
 * attribute.
 */
type AttributePartOp = {
  type: 'attribute-part';
  index: number;
  name: string;
  ctor: typeof AttributePart;
  strings: Array<string>;
  tagName: string;
  useCustomElementInstance?: boolean;
};

/**
 * Operation for an element binding. Although we only support directives in
 * element position which cannot emit anything, the opcode needs to index past
 * the part value
 */
type ElementPartOp = {
  type: 'element-part';
  index: number;
};

/**
 * Operator to create a custom element instance.
 */
type CustomElementOpenOp = {
  type: 'custom-element-open';
  tagName: string;
  ctor: {new (): HTMLElement};
  staticAttributes: Map<string, string>;
};

/**
 * Operation to render a custom element's attributes. This is separate from
 * `custom-element-open` because attribute/property parts go in between and need
 * to run and be set on the instance before we render the element's final
 * attributes.
 */
type CustomElementAttributesOp = {
  type: 'custom-element-attributes';
};

/**
 * Operation to render a custom element's children, usually its shadow root.
 */
type CustomElementShadowOp = {
  type: 'custom-element-shadow';
};

/**
 * Operation to close a custom element so that its no longer available for
 * bindings.
 */
type CustomElementClosedOp = {
  type: 'custom-element-close';
};

/**
 * Operation to mark an open slot.
 */
type SlotElementOpenOp = {
  type: 'slot-element-open';
  name: string | undefined;
};

/**
 * Operation to mark a slot as closed.
 */
type SlotElementCloseOp = {
  type: 'slot-element-close';
};

/**
 * Operation to mark a slotted element as open. We do this by checking
 * direct children of custom elements for the absence or presence of
 * the slot attribute. The absence of the slot attribute (i.e. unnamed slot)
 * is represented by undefined.
 */
type SlottedElementOpenOp = {
  type: 'slotted-element-open';
  name: string | undefined;
};

/**
 * Operation to mark a slotted element as closed.
 */
type SlottedElementCloseOp = {
  type: 'slotted-element-close';
};

/**
 * Operation to possibly emit the `<!--lit-node-->` marker; the operation
 * always emits if there were attribute parts, and may emit if the node
 * was a custom element and it needed `defer-hydration` because it was
 * rendered in the shadow root of another custom element host; we don't
 * know the latter at opcode generation time, and so that test is done at
 * runtime in the opcode.
 */
type PossibleNodeMarkerOp = {
  type: 'possible-node-marker';
  boundAttributesCount: number;
  nodeIndex: number;
};

type Op =
  | TextOp
  | ChildPartOp
  | AttributePartOp
  | ElementPartOp
  | CustomElementOpenOp
  | CustomElementAttributesOp
  | CustomElementShadowOp
  | CustomElementClosedOp
  | SlotElementOpenOp
  | SlotElementCloseOp
  | SlottedElementOpenOp
  | SlottedElementCloseOp
  | PossibleNodeMarkerOp;

/**
 * Any of these top level tags will be removed by parse5's `parseFragment` and
 * will cause part errors if there are any part bindings. For only the `html`,
 * `head`, and `body` tags, we use a page-level template `parse`.
 */
const REGEXP_TEMPLATE_HAS_TOP_LEVEL_PAGE_TAG =
  /^(\s|<!--[^(-->)]*-->)*(<(!doctype|html|head|body))/i;

/**
 * For a given TemplateResult, generates and/or returns a cached list of opcodes
 * for the associated Template.  Opcodes are designed to allow emitting
 * contiguous static text from the template as much as possible, with specific
 * non-`text` opcodes interleaved to perform dynamic work, such as emitting
 * values for ChildParts or AttributeParts, and handling custom elements.
 *
 * For the following example template, an opcode list may look like this:
 *
 * ```js
 * html`<div><span>Hello</span><span class=${'bold'}>${template()}</span></div>`
 * ```
 *
 * - `text`
 *   - Emit run of static text: `<div><span>Hello</span>`
 * - `possible-node-marker`
 *   - Emit `<!--lit-node n-->` marker since there are attribute parts
 * - `text`
 *   - Emit run of static text: `<span`
 * - `attribute-part`
 *   - Emit an AttributePart's value, e.g. ` class="bold"`
 * - `text`
 *   - Emit run of static text: `>`
 * - `child-part`
 *   - Emit the ChildPart's value, in this case a TemplateResult, thus we
 *     recurse into that template's opcodes
 * - `text`
 *   - Emit run of static text: `/span></div>`
 *
 * When a custom-element is encountered, the flow looks like this:
 *
 * ```js
 * html`<x-foo staticAttr dynamicAttr=${value}><div>child</div>...</x-foo>`
 * ```
 *
 * - `possible-node-marker`
 *   - Emit `<!--lit-node n-->` marker since there are attribute parts and we
 *      may emit the `defer-hydration` attribute on the node that follows
 * - `text`
 *   - Emit open tag `<x-foo`
 * - `custom-element-open`
 *   - Create the CE `instance`+`renderer` and put on
 *     `customElementInstanceStack`
 *   - Call `renderer.setAttribute()` for any `staticAttributes` (e.g.
 *     'staticAttr`)
 * - `attribute-part`(s)
 *   - Call `renderer.setAttribute()` or `renderer.setProperty()` for
 *     `AttributePart`/`PropertyPart`s (e.g. for `dynamicAttr`)
 * - `custom-element-attributes`
 *   - Call `renderer.connectedCallback()`
 *   - Emit `renderer.renderAttributes()`
 * - `text`
 *   - Emit end of open tag `>`
 * - `custom-element-shadow`
 *   - Emit `renderer.renderShadow()` (emits `<template shadowroot>` +
 *     recurses to emit `render()`)
 * - `text`
 *   - Emit run of static text within tag: `<div>child</div>...`
 * - ...(recurse to render more parts/children)...
 * - `custom-element-close`
 *   - Pop the CE `instance`+`renderer` off the `customElementInstanceStack`
 */
const getTemplateOpcodes = (result: TemplateResult) => {
  const template = templateCache.get(result.strings);
  if (template !== undefined) {
    return template;
  }
  const [html, attrNames] = getTemplateHtml(
    result.strings,
    // SVG TemplateResultType functionality is only required on the client,
    // which instantiates SVG elements within a svg namespace. Using SVG
    // on the server results in unneccesary svg containers being emitted.
    TemplateResultType.HTML
  );

  const hydratable = isHydratable(result);
  const htmlString = String(html);
  // Only server templates can use top level document tags such as `<html>`,
  // `<body>`, and `<head>`.
  const isPageLevelTemplate =
    !hydratable && REGEXP_TEMPLATE_HAS_TOP_LEVEL_PAGE_TAG.test(htmlString);

  /**
   * The html string is parsed into a parse5 AST with source code information
   * on; this lets us skip over certain ast nodes by string character position
   * while walking the AST.
   *
   * Server Templates may need to use `parse` as they may contain document tags such
   * as `<html>`.
   */
  const ast = (isPageLevelTemplate ? parse : parseFragment)(htmlString, {
    sourceCodeLocationInfo: true,
  });

  const ops: Array<Op> = [];

  /* The last offset of html written to the stream */
  let lastOffset: number | undefined = 0;

  /* Current attribute part index, for indexing attrNames */
  let attrIndex = 0;

  /**
   * Sets `lastOffset` to `offset`, skipping a range of characters. This is
   * useful for skipping and re-writing lit-html marker nodes, bound attribute
   * suffix, etc.
   */
  const skipTo = (offset: number) => {
    if (lastOffset === undefined) {
      throw new Error('lastOffset is undefined');
    }
    if (offset < lastOffset) {
      throw new Error(`offset must be greater than lastOffset.
        offset: ${offset}
        lastOffset: ${lastOffset}
      `);
    }
    lastOffset = offset;
  };

  /**
   * Records the given string to the output, either by appending to the current
   * opcode (if already `text`) or by creating a new `text` opcode (if the
   * previous opcode was not `text)
   */
  const flush = (value: string) => {
    const op = getLast(ops);
    if (op !== undefined && op.type === 'text') {
      op.value += value;
    } else {
      ops.push({
        type: 'text',
        value,
      });
    }
  };

  /**
   * Creates or appends to a text opcode with a substring of the html from the
   * `lastOffset` flushed to `offset`.
   */
  const flushTo = (offset?: number) => {
    if (lastOffset === undefined) {
      throw new Error('lastOffset is undefined');
    }
    const previousLastOffset = lastOffset;
    lastOffset = offset;
    const value = String(html).substring(previousLastOffset, offset);
    flush(value);
  };

  // Depth-first node index, counting only comment and element nodes, to match
  // client-side lit-html.
  let nodeIndex = 0;

  traverse(ast, {
    'pre:node'(node, parent) {
      if (isCommentNode(node)) {
        if (node.data === markerMatch) {
          flushTo(node.sourceCodeLocation!.startOffset);
          skipTo(node.sourceCodeLocation!.endOffset);
          ops.push({
            type: 'child-part',
            index: nodeIndex,
            useCustomElementInstance:
              parent && isElementNode(parent) && parent.isDefinedCustomElement,
          });
        }
        nodeIndex++;
      } else if (isElementNode(node)) {
        let boundAttributesCount = 0;

        const tagName = node.tagName;

        if (
          node.parentNode &&
          isElementNode(node.parentNode) &&
          node.parentNode.isDefinedCustomElement
        ) {
          // When the parent node is a custom element we check for the presence
          // or absence of the slot attribute. This allows us to track the
          // event tree with the association of the slot path.
          ops.push({
            type: 'slotted-element-open',
            name: node.attrs.find((a) => a.name === 'slot')?.value,
          });
        }

        if (tagName.indexOf('-') !== -1) {
          // Looking up the constructor here means that custom elements must be
          // registered before rendering the first template that contains them.
          const ctor = customElements.get(tagName);
          if (ctor !== undefined) {
            // Mark that this is a custom element
            node.isDefinedCustomElement = true;
            ops.push({
              type: 'custom-element-open',
              tagName,
              ctor,
              staticAttributes: new Map(
                node.attrs
                  .filter((attr) => !attr.name.endsWith(boundAttributeSuffix))
                  .map((attr) => [attr.name, attr.value])
              ),
            });
          }
        } else if (tagName === 'slot') {
          ops.push({
            type: 'slot-element-open',
            // Name is either assigned the slot name or undefined for
            // an unnamed slot.
            name: node.attrs.find((a) => a.name === 'name')?.value,
          });
        }
        const attrInfo = node.attrs.map((attr) => {
          const isAttrBinding = attr.name.endsWith(boundAttributeSuffix);
          const isElementBinding = attr.name.startsWith(marker);
          if (isAttrBinding || isElementBinding) {
            boundAttributesCount += 1;
          }
          return [isAttrBinding, isElementBinding, attr] as const;
        });
        if (boundAttributesCount > 0 || node.isDefinedCustomElement) {
          // We (may) need to emit a `<!-- lit-node -->` comment marker to
          // indicate the following node needs to be identified during
          // hydration when it has bindings or if it is a custom element (and
          // thus may need its `defer-hydration` to be removed, depending on
          // the `deferHydration` setting). The marker is emitted as a
          // previous sibling before the node in question, to avoid issues
          // with void elements (which do not have children) and raw text
          // elements (whose children are intepreted as text).
          flushTo(node.sourceCodeLocation!.startTag!.startOffset);
          ops.push({
            type: 'possible-node-marker',
            boundAttributesCount,
            nodeIndex,
          });
        }
        for (const [isAttrBinding, isElementBinding, attr] of attrInfo) {
          if (isAttrBinding || isElementBinding) {
            // Note that although we emit a lit-node comment marker for any
            // nodes with bindings, we don't account for it in the nodeIndex because
            // that will not be injected into the client template
            const strings = attr.value.split(marker);
            const attrSourceLocation =
              node.sourceCodeLocation!.attrs![attr.name]!;
            const attrNameStartOffset = attrSourceLocation.startOffset;
            const attrEndOffset = attrSourceLocation.endOffset;
            flushTo(attrNameStartOffset);
            if (isAttrBinding) {
              // We store the case-sensitive name from `attrNames` (generated
              // while parsing the template strings); note that this assumes
              // parse5 attribute ordering matches string ordering
              const name = attrNames[attrIndex++];
              const [, prefix, caseSensitiveName] = /([.?@])?(.*)/.exec(
                name as string
              )!;
              if (!hydratable) {
                if (prefix === '.') {
                  throw new Error(
                    `Server-only templates can't bind to properties. Bind to attributes instead, as they can be serialized when the template is rendered and sent to the browser.`
                  );
                } else if (prefix === '@') {
                  throw new Error(
                    `Server-only templates can't bind to events. There's no way to serialize an event listener when generating HTML and sending it to the browser.`
                  );
                }
              }
              ops.push({
                type: 'attribute-part',
                index: nodeIndex,
                name: caseSensitiveName,
                ctor:
                  prefix === '.'
                    ? PropertyPart
                    : prefix === '?'
                      ? BooleanAttributePart
                      : prefix === '@'
                        ? EventPart
                        : AttributePart,
                strings,
                tagName: tagName.toUpperCase(),
                useCustomElementInstance: node.isDefinedCustomElement,
              });
            } else {
              if (!hydratable) {
                throw new Error(`Server-only templates don't support element parts, as their API does not currently give them any way to render anything on the server. Found in template:
    ${displayTemplateResult(result)}`);
              }
              ops.push({
                type: 'element-part',
                index: nodeIndex,
              });
            }
            skipTo(attrEndOffset);
          } else if (node.isDefinedCustomElement) {
            // For custom elements, all static attributes are stored along
            // with the `custom-element-open` opcode so that we can set them
            // into the custom element instance, and then serialize them back
            // out along with any manually-reflected attributes. As such, we
            // skip over static attribute text here.
            const attrSourceLocation =
              node.sourceCodeLocation!.attrs![attr.name]!;
            flushTo(attrSourceLocation.startOffset);
            skipTo(attrSourceLocation.endOffset);
          }
        }

        if (node.isDefinedCustomElement) {
          // For custom elements, add an opcode to write out attributes,
          // close the tag, and then add an opcode to write the shadow
          // root
          flushTo(node.sourceCodeLocation!.startTag!.endOffset - 1);
          ops.push({
            type: 'custom-element-attributes',
          });
          flush('>');
          skipTo(node.sourceCodeLocation!.startTag!.endOffset);
          ops.push({
            type: 'custom-element-shadow',
          });
        } else if (
          !hydratable &&
          /^(title|textarea|script|style)$/.test(node.tagName)
        ) {
          const dangerous = isJavaScriptScriptTag(node);
          // Marker comments in a rawtext element will be parsed as text,
          // so we need to look at the text value of childnodes to try to
          // find them and render child-part opcodes.
          for (const child of node.childNodes) {
            if (!isTextNode(child)) {
              throw new Error(
                `Internal error: Unexpected child node inside raw text node, a ${node.tagName} should only contain text nodes, but found a ${node.nodeName} (tagname: ${node.tagName})`
              );
            }
            const text = child.value;
            const textStart = child.sourceCodeLocation!.startOffset;
            flushTo(textStart);
            const markerRegex = new RegExp(marker.replace(/\$/g, '\\$'), 'g');
            for (const mark of text.matchAll(markerRegex)) {
              flushTo(textStart + mark.index!);
              if (dangerous) {
                throw new Error(
                  `Found binding inside an executable <script> tag in a server-only template. For security reasons, this is not supported, as it could allow an attacker to execute arbitrary JavaScript. If you do need to create a script element with dynamic contents, you can use the unsafeHTML directive to make one, as that way the code is clearly marked as unsafe and needing careful handling. The template with the dangerous binding is:

    ${displayTemplateResult(result)}`
                );
              }
              if (node.tagName === 'style') {
                throw new Error(
                  `Found binding inside a <style> tag in a server-only template. For security reasons, this is not supported, as it could allow an attacker to exfiltrate information from the page. If you do need to create a style element with dynamic contents, you can use the unsafeHTML directive to make one, as that way the code is clearly marked as unsafe and needing careful handling. The template with the dangerous binding is:

    ${displayTemplateResult(result)}`
                );
              }
              ops.push({
                type: 'child-part',
                index: nodeIndex,
                useCustomElementInstance: false,
              });
              skipTo(textStart + mark.index! + mark[0].length);
            }
            flushTo(textStart + text.length);
          }
        } else if (!hydratable && isTemplateNode(node)) {
          // Server-only templates look inside of <template> nodes, because
          // we can afford the complexity and cost, and there's way more
          // benefit to be gained from it
          traverse(node.content, this, node);
        }

        nodeIndex++;
      }
    },
    node(node) {
      if (!isElementNode(node)) {
        return;
      }
      if (node.isDefinedCustomElement) {
        ops.push({
          type: 'custom-element-close',
        });
      } else if (node.tagName === 'slot') {
        ops.push({
          type: 'slot-element-close',
        });
      }
      if (
        node.parentNode &&
        isElementNode(node.parentNode) &&
        node.parentNode.isDefinedCustomElement
      ) {
        ops.push({
          type: 'slotted-element-close',
        });
      }
    },
  });
  // Flush remaining static text in the template (e.g. closing tags)
  flushTo();
  templateCache.set(result.strings, ops);
  return ops;
};

export type RenderInfo = {
  /**
   * Element renderers to use
   */
  elementRenderers: ElementRendererConstructor[];

  /**
   * Stack of open custom elements (in light dom or shadow dom)
   */
  customElementInstanceStack: Array<ElementRenderer | undefined>;

  /**
   * Stack of open host custom elements (n-1 will be n's host)
   */
  customElementHostStack: Array<ElementRenderer | undefined>;

  /**
   * Stack of open event target instances.
   */
  eventTargetStack: Array<HTMLElement | undefined>;

  /**
   * Stack of current slot context.
   */
  slotStack: Array<string | undefined>;

  /**
   * An optional callback to notify when a custom element has been rendered.
   *
   * This allows servers to know what specific tags were rendered for a given
   * template, even in the case of conditional templates.
   */
  customElementRendered?: (tagName: string) => void;

  /**
   * Flag to defer hydration of top level custom element. Defaults to false.
   */
  deferHydration: boolean;
};

declare global {
  interface Array<T> {
    flat(depth: number): Array<T>;
  }
}

export function* renderValue(
  value: unknown,
  renderInfo: RenderInfo,
  hydratable = true
): RenderResult {
  if (renderInfo.customElementHostStack.length === 0) {
    // If the SSR root event target is not at the start of the event target
    // stack, we add it to the beginning of the array.
    // This only applies if we are in the top level document and not in a
    // Shadow DOM.
    const rootEventTarget = renderInfo.eventTargetStack[0];
    if (rootEventTarget !== litServerRoot) {
      renderInfo.eventTargetStack.unshift(litServerRoot);
      if (rootEventTarget) {
        // If an entry in the event target stack was provided and it was not
        // the event root target, we need to connect the given event target
        // to the root event target.
        (rootEventTarget as HTMLElementWithEventMeta).__eventTargetParent =
          rootEventTarget;
      }
    }
  }

  patchIfDirective(value);
  if (isRenderLightDirective(value)) {
    // If a value was produced with renderLight(), we want to call and render
    // the renderLight() method.
    const instance = getLast(renderInfo.customElementInstanceStack);
    if (instance !== undefined) {
      const renderLightResult = instance.renderLight(renderInfo);
      if (renderLightResult !== undefined) {
        yield* renderLightResult;
      }
    }
    value = null;
  } else {
    value = resolveDirective(
      connectedDisconnectable({type: PartType.CHILD}) as ChildPart,
      value
    );
  }
  if (value != null && isTemplateResult(value)) {
    if (hydratable) {
      yield `<!--lit-part ${digestForTemplateResult(
        value as TemplateResult
      )}-->`;
    }
    yield* renderTemplateResult(value as TemplateResult, renderInfo);
    if (hydratable) {
      yield `<!--/lit-part-->`;
    }
  } else {
    if (hydratable) {
      yield `<!--lit-part-->`;
    }
    if (
      value === undefined ||
      value === null ||
      value === nothing ||
      value === noChange
    ) {
      // yield nothing
    } else if (!isPrimitive(value) && isIterable(value)) {
      // Check that value is not a primitive, since strings are iterable
      for (const item of value) {
        yield* renderValue(item, renderInfo, hydratable);
      }
    } else {
      yield escapeHtml(String(value));
    }
    if (hydratable) {
      yield `<!--/lit-part-->`;
    }
  }
}

function* renderTemplateResult(
  result: TemplateResult,
  renderInfo: RenderInfo
): RenderResult {
  // In order to render a TemplateResult we have to handle and stream out
  // different parts of the result separately:
  //   - Literal sections of the template
  //   - Defined custom element within the literal sections
  //   - Values in the result
  //
  // This means we can't just iterate through the template literals and values,
  // we must parse and traverse the template's HTML. But we don't want to pay
  // the cost of serializing the HTML node-by-node when we already have the
  // template in string form. So we parse with location info turned on and use
  // that to index into the HTML string generated by TemplateResult.getHTML().
  // During the tree walk we will handle expression marker nodes and custom
  // elements. For each we will record the offset of the node, and output the
  // previous span of HTML.

  const hydratable = isHydratable(result);
  const ops = getTemplateOpcodes(result);

  /* The next value in result.values to render */
  let partIndex = 0;

  for (const op of ops) {
    switch (op.type) {
      case 'text':
        yield op.value;
        break;
      case 'child-part': {
        const value = result.values[partIndex++];
        let isValueHydratable = hydratable;
        if (isTemplateResult(value)) {
          isValueHydratable = isHydratable(value);
          if (!isValueHydratable && hydratable) {
            throw new Error(
              `A server-only template can't be rendered inside an ordinary, hydratable template. A server-only template can only be rendered at the top level, or within other server-only templates. The outer template was:
    ${displayTemplateResult(result)}

And the inner template was:
    ${displayTemplateResult(value)}
              `
            );
          }
        }
        yield* renderValue(value, renderInfo, isValueHydratable);
        break;
      }
      case 'attribute-part': {
        const statics = op.strings;
        const part = new op.ctor(
          // Passing only object with tagName for the element is fine since the
          // directive only gets PartInfo without the node available in the
          // constructor
          {tagName: op.tagName} as HTMLElement,
          op.name,
          statics,
          connectedDisconnectable(),
          {}
        );
        const value =
          part.strings === undefined ? result.values[partIndex] : result.values;
        patchAnyDirectives(part, value, partIndex);
        let committedValue: unknown = noChange;
        // Values for EventParts are never emitted
        if (!(part.type === PartType.EVENT)) {
          committedValue = getAttributePartCommittedValue(
            part,
            value,
            partIndex
          );
        }
        // We don't emit anything on the server when value is `noChange` or
        // `nothing`
        if (committedValue !== noChange) {
          const instance = op.useCustomElementInstance
            ? getLast(renderInfo.customElementInstanceStack)
            : undefined;
          if (part.type === PartType.PROPERTY) {
            yield* renderPropertyPart(instance, op, committedValue);
          } else if (part.type === PartType.BOOLEAN_ATTRIBUTE) {
            // Boolean attribute binding
            yield* renderBooleanAttributePart(instance, op, committedValue);
          } else {
            yield* renderAttributePart(instance, op, committedValue);
          }
        }
        partIndex += statics.length - 1;
        break;
      }
      case 'element-part': {
        // We don't emit anything for element parts (since we only support
        // directives for now; since they can't render, we don't even bother
        // running them), but we still need to advance the part index
        partIndex++;
        break;
      }
      case 'custom-element-open': {
        // Instantiate the element and its renderer
        const instance = getElementRenderer(
          renderInfo,
          op.tagName,
          op.ctor,
          op.staticAttributes
        );
        if (instance.element) {
          // In the case the renderer has created an instance, we want to set
          // the event target parent and the host of the element. Our
          // EventTarget polyfill uses these values to calculate the
          // composedPath of a dispatched event.
          // Note that the event target parent is either the unnamed/named slot
          // in the parent event target if it exists or the parent event target
          // if no matching slot exists.
          const eventTarget = getLast(
            renderInfo.eventTargetStack
          ) as HTMLElementWithEventMeta;
          const slotName = getLast(renderInfo.slotStack);
          (instance.element as HTMLElementWithEventMeta).__eventTargetParent =
            elementSlotMap.get(eventTarget)?.get(slotName) ?? eventTarget;
          (instance.element as HTMLElementWithEventMeta).__host = getLast(
            renderInfo.customElementHostStack
          )?.element;
          renderInfo.eventTargetStack.push(instance.element);
        }
        // Set static attributes to the element renderer
        for (const [name, value] of op.staticAttributes) {
          instance.setAttribute(name, value);
        }
        renderInfo.customElementInstanceStack.push(instance);
        renderInfo.customElementRendered?.(op.tagName);
        break;
      }
      case 'custom-element-attributes': {
        const instance = getLast(renderInfo.customElementInstanceStack);
        if (instance === undefined) {
          throw new Error(
            `Internal error: ${op.type} outside of custom element context`
          );
        }
        // Perform any connect-time work via the renderer (e.g. reflecting any
        // properties to attributes, for example)
        if (instance.connectedCallback) {
          instance.connectedCallback();
        }
        // Render out any attributes on the instance (both static and those
        // that may have been dynamically set by the renderer)
        yield* instance.renderAttributes();
        // If deferHydration flag is true or if this element is nested in
        // another, add the `defer-hydration` attribute, so that it does not
        // enable before the host element hydrates
        if (
          renderInfo.deferHydration ||
          renderInfo.customElementHostStack.length > 0
        ) {
          yield ' defer-hydration';
        }
        break;
      }
      case 'possible-node-marker': {
        // Add a node marker if this element had attribute bindings or if it
        // was nested in another and we rendered the `defer-hydration` attribute
        // since the hydration node walk will need to stop at this element
        // to hydrate it
        if (
          op.boundAttributesCount > 0 ||
          renderInfo.customElementHostStack.length > 0
        ) {
          if (hydratable) {
            yield `<!--lit-node ${op.nodeIndex}-->`;
          }
        }
        break;
      }
      case 'custom-element-shadow': {
        const instance = getLast(renderInfo.customElementInstanceStack);
        if (instance === undefined) {
          throw new Error(
            `Internal error: ${op.type} outside of custom element context`
          );
        }
        renderInfo.customElementHostStack.push(instance);
        const shadowContents = instance.renderShadow(renderInfo);
        // Only emit a DSR if renderShadow() emitted something (returning
        // undefined allows effectively no-op rendering the element)
        if (shadowContents !== undefined) {
          const {mode = 'open', delegatesFocus} =
            instance.shadowRootOptions ?? {};
          // `delegatesFocus` is intentionally allowed to coerce to boolean to
          // match web platform behavior.
          const delegatesfocusAttr = delegatesFocus
            ? ' shadowrootdelegatesfocus'
            : '';
          yield `<template shadowroot="${mode}" shadowrootmode="${mode}"${delegatesfocusAttr}>`;
          yield* shadowContents;
          yield '</template>';
        }
        renderInfo.customElementHostStack.pop();
        break;
      }
      case 'custom-element-close':
        renderInfo.customElementInstanceStack.pop();
        renderInfo.eventTargetStack.pop();
        break;
      case 'slot-element-open': {
        const host = getLast(renderInfo.customElementHostStack);
        if (host === undefined) {
          throw new Error(
            `Internal error: ${op.type} outside of custom element context`
          );
        } else if (host.element) {
          // We need to track which element has which slots. This is necessary
          // to calculate the correct event path by connecting children of the
          // host element to the corresponding slot.
          let slots = elementSlotMap.get(host.element);
          if (slots === undefined) {
            slots = new Map();
            elementSlotMap.set(host.element, slots);
          }
          // op.name is either the slot name or undefined, which represents
          // the unnamed slot case.
          if (!slots.has(op.name)) {
            const element = new HTMLSlotElement() as HTMLSlotElement &
              HTMLElementWithEventMeta;
            element.name = op.name ?? '';
            const eventTarget = getLast(
              renderInfo.eventTargetStack
            ) as HTMLElementWithEventMeta;
            const slotName = getLast(renderInfo.slotStack);
            element.__eventTargetParent =
              elementSlotMap.get(eventTarget)?.get(slotName) ?? eventTarget;
            element.__host = getLast(
              renderInfo.customElementHostStack
            )?.element;
            slots.set(op.name, element);
            renderInfo.eventTargetStack.push(element);
          }
        }

        break;
      }
      case 'slot-element-close':
        renderInfo.eventTargetStack.pop();
        break;
      case 'slotted-element-open':
        renderInfo.slotStack.push(op.name);
        break;
      case 'slotted-element-close':
        renderInfo.slotStack.pop();
        break;
      default:
        throw new Error('internal error');
    }
  }

  if (partIndex !== result.values.length) {
    throwErrorForPartIndexMismatch(partIndex, result);
  }
}

function throwErrorForPartIndexMismatch(
  partIndex: number,
  result: TemplateResult
) {
  const errorMsg = `
    Unexpected final partIndex: ${partIndex} !== ${
      result.values.length
    } while processing the following template:

    ${displayTemplateResult(result)}

    This could be because you're attempting to render an expression in an invalid location. See
    https://lit.dev/docs/templates/expressions/#invalid-locations for more information about invalid expression
    locations.
  `;

  throw new Error(errorMsg);
}

function* renderPropertyPart(
  instance: ElementRenderer | undefined,
  op: AttributePartOp,
  value: unknown
) {
  value = value === nothing ? undefined : value;
  // Property should be reflected to attribute
  const reflectedName = reflectedAttributeName(op.tagName, op.name);
  if (instance !== undefined) {
    instance.setProperty(op.name, value);
  }
  if (reflectedName !== undefined) {
    yield `${reflectedName}="${escapeHtml(String(value))}"`;
  }
}

function* renderBooleanAttributePart(
  instance: ElementRenderer | undefined,
  op: AttributePartOp,
  value: unknown
) {
  if (value && value !== nothing) {
    if (instance !== undefined) {
      instance.setAttribute(op.name, '');
    } else {
      yield op.name;
    }
  }
}

function* renderAttributePart(
  instance: ElementRenderer | undefined,
  op: AttributePartOp,
  value: unknown
) {
  if (value !== nothing) {
    if (instance !== undefined) {
      instance.setAttribute(op.name, String(value ?? ''));
    } else {
      yield `${op.name}="${escapeHtml(String(value ?? ''))}"`;
    }
  }
}

/**
 * Returns a debug string suitable for an error message describing a
 * TemplateResult.
 */
function displayTemplateResult(
  result: TemplateResult | CompiledTemplateResult
) {
  if (isCompiledTemplateResult(result)) {
    return result._$litType$.h.join('${...}');
  }
  return result.strings.join('${...}');
}

const getLast = <T>(a: Array<T>) => a[a.length - 1];

/**
 * Returns true if the given node is a <script> node that the browser will
 * automatically execute if it's rendered on server-side, outside of a
 * <template> tag.
 */
function isJavaScriptScriptTag(node: Element | Template): boolean {
  function isScriptTag(node: Element | Template): node is Element {
    return /script/i.test(node.tagName);
  }

  if (!isScriptTag(node)) {
    return false;
  }
  let safeTypeSeen = false;
  for (const attr of node.attrs) {
    if (attr.name !== 'type') {
      continue;
    }
    switch (attr.value) {
      // see: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#textjavascript
      case null:
      case undefined:
      case '':
      case 'module':
      case 'text/javascript':
      case 'application/javascript':
      case 'application/ecmascript':
      case 'application/x-ecmascript':
      case 'application/x-javascript':
      case 'text/ecmascript':
      case 'text/javascript1.0':
      case 'text/javascript1.1':
      case 'text/javascript1.2':
      case 'text/javascript1.3':
      case 'text/javascript1.4':
      case 'text/javascript1.5':
      case 'text/jscript':
      case 'text/livescript':
      case 'text/x-ecmascript':
      case 'text/x-javascript':
        // If we see a dangerous type, we can stop looking
        return true;
      default:
        safeTypeSeen = true;
    }
  }
  // So, remember that attributes can be repeated. If we saw a dangerous type,
  // then we would have returned early. However, if there's no type, then
  // that's dangerous.
  // It's only if all types seen were safe, and we saw at least one type, that
  // we can return false.
  const willExecute = !safeTypeSeen;
  return willExecute;
}
