/// <reference lib="dom" />

/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {TemplateResult, ChildPart} from 'lit';
import type {
  Directive,
  DirectiveClass,
  DirectiveResult,
} from 'lit/directive.js';

import {nothing, noChange} from 'lit';
import {PartType} from 'lit/directive.js';
import {
  isPrimitive,
  isTemplateResult,
  getDirectiveClass,
  TemplateResultType,
} from 'lit/directive-helpers.js';
import {_$LH} from 'lit-html/private-ssr-support.js';

const {
  getTemplateHtml,
  marker,
  markerMatch,
  boundAttributeSuffix,
  overrideDirectiveResolve,
  setDirectiveClass,
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

import {
  ElementRenderer,
  ElementRendererConstructor,
  getElementRenderer,
} from './element-renderer.js';

import {escapeHtml} from './util/escape-html.js';

import {parseFragment} from 'parse5';
import {isElementNode, isCommentNode, traverse} from '@parse5/tools';

import {isRenderLightDirective} from '@lit-labs/ssr-client/directives/render-light.js';
import {reflectedAttributeName} from './reflected-attributes.js';

import type {RenderResult} from './render-result.js';

declare module 'parse5/dist/tree-adapters/default.js' {
  interface Element {
    isDefinedCustomElement?: boolean;
  }
}

const patchedDirectiveCache = new WeakMap<DirectiveClass, DirectiveClass>();

/**
 * Looks for values of type `DirectiveResult` and replaces its Directive class
 * with a subclass that calls `render` rather than `update`
 */
const patchIfDirective = (value: unknown) => {
  // This property needs to remain unminified.
  const directiveCtor = getDirectiveClass(value);
  if (directiveCtor !== undefined) {
    let patchedCtor = patchedDirectiveCache.get(directiveCtor);
    if (patchedCtor === undefined) {
      patchedCtor = overrideDirectiveResolve(
        directiveCtor,
        (directive: Directive, values: unknown[]) => {
          // Since the return value may also be a directive result in the case of
          // nested directives, we may need to patch that as well
          return patchIfDirective(directive.render(...values));
        }
      );
      patchedDirectiveCache.set(directiveCtor, patchedCtor);
    }
    // This property needs to remain unminified.
    setDirectiveClass(value as DirectiveResult, patchedCtor);
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

const templateCache = new Map<TemplateStringsArray, Array<Op>>();
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
  | PossibleNodeMarkerOp;

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
 *   - Emit end of of open tag `>`
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
  // The property '_$litType$' needs to remain unminified.
  const [html, attrNames] = getTemplateHtml(
    result.strings,
    // SVG TemplateResultType functionality is only required on the client,
    // which instantiates SVG elements within a svg namespace. Using SVG
    // on the server results in unneccesary svg containers being emitted.
    TemplateResultType.HTML
  );

  /**
   * The html string is parsed into a parse5 AST with source code information
   * on; this lets us skip over certain ast nodes by string character position
   * while walking the AST.
   */
  const ast = parseFragment(String(html), {
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
            // We store the case-sensitive name from `attrNames` (generated
            // while parsing the template strings); note that this assumes
            // parse5 attribute ordering matches string ordering
            const name = attrNames[attrIndex++];
            const attrSourceLocation =
              node.sourceCodeLocation!.attrs![attr.name]!;
            const attrNameStartOffset = attrSourceLocation.startOffset;
            const attrEndOffset = attrSourceLocation.endOffset;
            flushTo(attrNameStartOffset);
            if (isAttrBinding) {
              const [, prefix, caseSensitiveName] = /([.?@])?(.*)/.exec(
                name as string
              )!;
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
        }
        nodeIndex++;
      }
    },
    node(node) {
      if (isElementNode(node) && node.isDefinedCustomElement) {
        ops.push({
          type: 'custom-element-close',
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
  renderInfo: RenderInfo
): RenderResult {
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
    yield `<!--lit-part ${digestForTemplateResult(value as TemplateResult)}-->`;
    yield* renderTemplateResult(value as TemplateResult, renderInfo);
  } else {
    yield `<!--lit-part-->`;
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
        yield* renderValue(item, renderInfo);
      }
    } else {
      yield escapeHtml(String(value));
    }
  }
  yield `<!--/lit-part-->`;
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
        yield* renderValue(value, renderInfo);
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
          yield `<!--lit-node ${op.nodeIndex}-->`;
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

    ${result.strings.join('${...}')}

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

const getLast = <T>(a: Array<T>) => a[a.length - 1];
