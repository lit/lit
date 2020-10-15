/// <reference lib="dom" />

/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

// Type-only imports
import {
  TemplateResult,
  DirectiveResult,
} from 'lit-html';

import {
  nothing,
  noChange,
  Directive,
  Part,
  NODE_PART,
  AttributePart,
} from 'lit-html';

import {
  $litPrivate
} from 'lit-html/private-ssr-support.js';

const {
  getTemplateHtml,
  marker,
  markerMatch,
  boundAttributeSuffix,
} = $litPrivate;

import { digestForTemplateResult } from 'lit-html/hydrate.js';

import {ElementRenderer} from './element-renderer.js';

import {escapeAttribute, escapeTextContent} from './util/escaping.js';

// types only
import {DefaultTreeDocumentFragment} from 'parse5';

import {
  traverse,
  parseFragment,
  isCommentNode,
  isElement,
} from './util/parse5-utils.js';

// import {isRenderLightDirective} from 'lit-element/lib/render-light.js';
import {LitElementRenderer} from './lit-element-renderer.js';
import {reflectedAttributeName} from './reflected-attributes.js';

declare module 'parse5' {
  interface DefaultTreeElement {
    isDefinedCustomElement?: boolean;
  }
}

Directive.prototype.resolve = function (this: Directive, _part: Part, values: any[]) {
  return this.render(...values);
}

const templateCache = new Map<
  TemplateStringsArray,
  {
    ops: Array<Op>;
    attrNames: Array<string>;
  }
>();

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
type NodePartOp = {
  type: 'node-part';
  index: number;
  useCustomElementInstance?: boolean;
};

/**
 * Operation to output an attribute with bindings. Includes all bindings for an
 * attribute, like an attribute template part or AttributeComitter.
 */
type AttributePartOp = {
  type: 'attribute-part';
  index: number;
  name: string;
  strings: Array<string>;
  tagName: string;
  useCustomElementInstance?: boolean;
};

/**
 * Operator to create a custom element instance.
 */
type CustomElementOpenOp = {
  type: 'custom-element-open';
  tagName: string;
  ctor: any;
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
type CustomElementChildrenOp = {
  type: 'custom-element-children';
};

/**
 * Operation to close a custom element so that its no longer available for
 * bindings.
 */
type CustomElementClosedOp = {
  type: 'custom-element-close';
};

type Op =
  | TextOp
  | NodePartOp
  | AttributePartOp
  | CustomElementOpenOp
  | CustomElementAttributesOp
  | CustomElementChildrenOp
  | CustomElementClosedOp;

const getTemplate = (result: TemplateResult) => {
  const template = templateCache.get(result.strings);
  if (template !== undefined) {
    return template;
  }
  const {html, attrNames} = getTemplateHtml(result.strings, result._$litType$);
  const ast = parseFragment(html, {
    sourceCodeLocationInfo: true,
  }) as DefaultTreeDocumentFragment;

  const ops: Array<Op> = [];

  /* The last offset of html written to the stream */
  let lastOffset: number | undefined = 0;

  /**
   * Sets `lastOffset` to `offset`, skipping a range of characters. This is
   * useful for skipping <slot>s and distributed nodes in flattened mode, or
   * skipping and re-writting lit-html marker nodes.
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
   * Creates or appends to a text opcode with a substring of the html from the
   * `lastOffset` flushed to `offset`.
   */
  const flushTo = (offset?: number) => {
    if (lastOffset === undefined) {
      throw new Error('lastOffset is undefined');
    }
    const previousLastOffset = lastOffset;
    lastOffset = offset;
    const value = html.substring(previousLastOffset, offset);
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

  // Depth-first node index. Initialized to -1 so that the first child node is
  // index 0, to match client-side lit-html.
  let nodeIndex = -1;

  traverse(ast, {
    pre(node, parent) {
      if (isCommentNode(node)) {
        if (node.data === markerMatch) {
          flushTo(node.sourceCodeLocation!.startOffset);
          skipTo(node.sourceCodeLocation!.endOffset);
          ops.push({
            type: 'node-part',
            index: nodeIndex,
            useCustomElementInstance:
              parent && isElement(parent) && parent.isDefinedCustomElement,
          });
          // There will be two comments per part (open+close) in the rendered
          // output and on the client, so increment again for that
          // nodeIndex++;
        }
      } else if (isElement(node)) {
        // Whether to flush the start tag. This is neccessary if we're changing
        // any of the attributes in the tag, so it's true for custom-elements
        // which might reflect their own state, or any element with a binding.
        let writeTag = false;
        let boundAttrsCount = 0;

        const tagName = node.tagName;
        let ctor;

        if (tagName.indexOf('-') !== -1) {
          // Looking up the constructor here means that custom elements must be
          // registered before rendering the first template that contains them.
          ctor = customElements.get(tagName);
          if (ctor !== undefined) {
            // Write the start tag
            writeTag = true;
            // Mark that this is a custom element
            node.isDefinedCustomElement = true;
            ops.push({
              type: 'custom-element-open',
              tagName,
              ctor,
              staticAttributes: new Map(node.attrs
                .filter(attr => !attr.name.endsWith(boundAttributeSuffix))
                .map(attr => ([attr.name, attr.value])))
            });
          }
        }
        if (node.attrs.length > 0) {
          for (const attr of node.attrs) {
            if (attr.name.endsWith(boundAttributeSuffix)) {
              writeTag = true;
              boundAttrsCount += 1;
              // Note that although we emit a lit-bindings comment marker for any
              // nodes with bindings, we don't account for it in the nodeIndex because
              // that will not be injected into the client template
              const name = attr.name.substring(
                0,
                attr.name.length - boundAttributeSuffix.length
              );
              const strings = attr.value.split(marker);
              const attrSourceLocation = node.sourceCodeLocation!.attrs[
                attr.name
              ];
              const attrNameStartOffset = attrSourceLocation.startOffset;
              const attrEndOffset = attrSourceLocation.endOffset;
              flushTo(attrNameStartOffset);
              ops.push({
                type: 'attribute-part',
                index: nodeIndex,
                name,
                strings,
                tagName,
                useCustomElementInstance: ctor !== undefined,
              });
              skipTo(attrEndOffset);
            } else if (node.isDefinedCustomElement) {
              // We will wait until after connectedCallback() and render all
              // custom element attributes then
              const attrSourceLocation = node.sourceCodeLocation!.attrs[
                attr.name
              ];
              flushTo(attrSourceLocation.startOffset);
              skipTo(attrSourceLocation.endOffset);
            }
          }
        }

        if (writeTag) {
          if (node.isDefinedCustomElement) {
            flushTo(node.sourceCodeLocation!.startTag.endOffset - 1);
            ops.push({
              type: 'custom-element-attributes'
            });
            flush('>');
            skipTo(node.sourceCodeLocation!.startTag.endOffset);
          } else {
            flushTo(node.sourceCodeLocation!.startTag.endOffset);
          }
        }

        if (boundAttrsCount > 0) {
          flush(`<!--lit-bindings ${nodeIndex}-->`);
        }

        if (ctor !== undefined) {
          ops.push({
            type: 'custom-element-children',
          });
        }
      }
      nodeIndex++;
    },
    post(node) {
      if (isElement(node) && node.isDefinedCustomElement) {
        ops.push({
          type: 'custom-element-close',
        });
      }
    },
  });
  flushTo();
  const t = {ops, attrNames};
  templateCache.set(result.strings, t);
  return t;
};

export type RenderInfo = {
  customElementInstanceStack: Array<ElementRenderer | undefined>;
};

declare global {
  interface Array<T> {
    flat(depth: number): Array<T>;
  }
}


export function* render(value: unknown): IterableIterator<string> {
  yield* renderValue(value, {customElementInstanceStack: []});
}

export function* renderValue(
  value: unknown,
  renderInfo: RenderInfo
): IterableIterator<string> {
  /*if (isRenderLightDirective(value)) {
    // If a value was produced with renderLight(), we want to call and render
    // the renderLight() method.
    const instance = getLast(renderInfo.customElementInstanceStack);
    // TODO, move out of here into something LitElement specific
    if (instance !== undefined) {
      yield* instance.renderLight(renderInfo);
    }
    value = null;
  } else*/ if (value != null && (value as any)._$litDirective$) {
    const directive = (value as DirectiveResult)._$litDirective$;
    value = new directive({type: NODE_PART}).render(...(value as DirectiveResult).values);
  }
  if (value != null && (value as TemplateResult)._$litType$ !== undefined) {
    yield `<!--lit-part ${digestForTemplateResult(value as TemplateResult)}-->`;
    yield* renderTemplateResult(value as TemplateResult, renderInfo);
  } else {
    yield `<!--lit-part-->`;
    if (value === undefined || value === null || value === nothing || value === noChange) {
      // yield nothing
    } else if (Array.isArray(value)) {
      for (const item of value) {
        yield* renderValue(item, renderInfo);
      }
    } else {
      yield escapeTextContent(String(value));
    }
  }
  yield `<!--/lit-part-->`;
}

export function* renderTemplateResult(
  result: TemplateResult,
  renderInfo: RenderInfo
): IterableIterator<string> {
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

  const {ops, attrNames} = getTemplate(result);

  /* The next value in result.values to render */
  let partIndex = 0;
  let attrIndex = 0;

  for (const op of ops) {
    switch (op.type) {
      case 'text':
        yield op.value;
        break;
      case 'node-part': {
        const value = result.values[partIndex++];
        yield* renderValue(value, renderInfo);
        break;
      }
      case 'attribute-part': {
        const name = attrNames[attrIndex++];
        const statics = op.strings;
        let attributeName = op.name;
        const prefix = attributeName[0];
        const attributePart = new AttributePart(
          null as any as HTMLElement,
          name,
          statics
        );
        let value = attributePart.strings === undefined ? result.values[partIndex] : result.values;
        value = attributePart._resolveValue(value, partIndex);
        const instance = op.useCustomElementInstance
          ? getLast(renderInfo.customElementInstanceStack)
          : undefined;
        if (prefix === '.') {
          const propertyName = name.substring(1);
          // Property should be reflected to attribute
          const reflectedName = reflectedAttributeName(
            op.tagName,
            propertyName
          );
          // Property should be set to custom element instance
          const instance = op.useCustomElementInstance
            ? getLast(renderInfo.customElementInstanceStack)
            : undefined;
          if (instance || reflectedName !== undefined) {
            if (value !== noChange) {
              if (instance !== undefined) {
                instance.setProperty(propertyName, value);
              }
              if (reflectedName !== undefined) {
                yield `${reflectedName}="${escapeAttribute(String(value))}"`;
              }
            }
          }
        } else if (prefix === '@') {
          // Event binding, do nothing with values
        } else if (prefix === '?') {
          // Boolean attribute binding
          attributeName = attributeName.substring(1);
          if (value && value !== noChange) {
            yield attributeName;
          }
        } else {
          if (value !== noChange) {
            if (instance !== undefined) {
              instance.setAttribute(attributeName, value as string);
            } else {
              yield `${attributeName}="${escapeAttribute(String(value))}"`;
            }
          }
        }
        partIndex += statics.length - 1;
        break;
      }
      case 'custom-element-open': {
        const ctor = op.ctor;
        // Instantiate the element and stream its render() result
        let instance = undefined;
        try {
          const element = new ctor();
          (element as any).tagName = op.tagName;
          instance = new LitElementRenderer(element);
        } catch (e) {
          console.error('Exception in custom element constructor', e);
        }
        renderInfo.customElementInstanceStack.push(instance);
        break;
      }
      case 'custom-element-attributes': {
        const instance = getLast(renderInfo.customElementInstanceStack);
        if (instance !== undefined) {
          if (instance.connectedCallback) {
            instance.connectedCallback();
          }
          yield* instance.renderAttributes();
        }
        break;
      }
      case 'custom-element-children': {
        const instance = getLast(renderInfo.customElementInstanceStack);
        if (instance !== undefined) {
          yield* instance.renderChildren();
        }
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
    throw new Error(
      `unexpected final partIndex: ${partIndex} !== ${result.values.length}`
    );
  }
}

const getLast = <T>(a: Array<T>) => a[a.length - 1];
