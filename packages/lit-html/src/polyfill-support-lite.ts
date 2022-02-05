/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * lit-html patch to support a lightweight web components shim for
 * custom elements and shadow dom slot distribution.
 *
 * Creating scoped CSS is not covered by this module. It is, however, integrated
 * into the lit-element and @lit/reactive-element packages. See the ShadyCSS docs
 * for how to apply scoping to CSS:
 * https://github.com/webcomponents/polyfills/tree/master/packages/shadycss#usage.
 *
 * @packageDocumentation
 */

// IMPORTANT: these imports must be type-only
import type {DirectiveResult} from './directive.js';

// Note, explicitly use `var` here so that this can be re-defined when
// bundled.
// eslint-disable-next-line no-var
var DEV_MODE = true;

export const litShadowKey = '_$litShadowPart$';
export const litChildPartKey = '_$litChildPart$';
const ELEMENT_PART = 6;

interface NodeWithPart extends ChildNode {
  [litChildPartKey]?: ShadowChildPart;
}

interface NodeWithShadow extends ParentNode {
  [litShadowKey]?: ShadowChildPart;
}

type ElementTemplatePart = {
  readonly type: typeof ELEMENT_PART;
  readonly index: number;
  value?: DirectiveResult;
};

interface PatchableTemplate {
  el: HTMLTemplateElement;
}

interface RenderOptions {
  readonly renderBefore?: ChildNode | null;
  scope?: string;
}

// Note, this is a dummy type as the full type here is big.
interface Directive {
  __directive?: Directive;
}

interface DirectiveParent {
  _$parent?: DirectiveParent;
  __directive?: Directive;
  __directives?: Array<Directive | undefined>;
}

export interface ShadowChildPart {
  __directive?: Directive;
  _$committedValue: unknown;
  _$startNode: NodeWithPart;
  _$endNode: ChildNode | null;
  parentNode: NodeWithShadow;
  options: RenderOptions;
  _$setValue(value: unknown, directiveParent: DirectiveParent): void;
  _$insert<Node>(node: Node, ref: Node | null): Node;
  _$clear(start?: ChildNode | null, from?: number): void;
  _$nodes: NodeWithPart[];
}

interface PatchableTemplateConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): PatchableTemplate;
}

interface ShadowChildPartConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): ShadowChildPart;
}

export const getPartNodes = (part: ShadowChildPart): NodeWithPart[] =>
  part._$nodes
    ? part._$nodes.flatMap((n) => [
        n,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ...(n._$litChildPart$ ? getPartNodes(n._$litChildPart$) : []),
      ])
    : [];

export const ElementPartProcessors = new Set<
  (el: Element) => DirectiveResult | void
>();

/**
 */
const polyfillSupport: NonNullable<typeof litHtmlPolyfillSupport> = (
  Template: PatchableTemplateConstructor,
  ChildPart: ShadowChildPartConstructor
) => {
  // ChildPart patched for slotting
  // Ensure startNode maps back to part
  const childPartSetValue = ChildPart.prototype._$setValue;
  ChildPart.prototype._$setValue = function (
    value: unknown,
    directiveParent: DirectiveParent
  ) {
    this._$startNode._$litChildPart$ ??= this;
    childPartSetValue.call(this, value, directiveParent);
  };

  const parentIsShadowHost = (part: ShadowChildPart) => {
    // const parent = part._$startNode.parentNode as NodeWithShadow | null;
    const parent = part.parentNode;
    return parent !== null && parent[litShadowKey] !== undefined;
  };

  const childPartClear = ChildPart.prototype._$clear;
  ChildPart.prototype._$clear = function (
    start: NodeWithPart | null = null,
    from?: number
  ) {
    start ??= this._$startNode.nextSibling;
    if (parentIsShadowHost(this)) {
      removeNodes(this, start);
    }
    childPartClear.call(this, start, from);
  };

  const childPartInsert = ChildPart.prototype._$insert;
  ChildPart.prototype._$insert = function (
    node: NodeWithPart,
    ref: NodeWithPart | null
  ) {
    if (parentIsShadowHost(this)) {
      addNode(this, node, ref);
    }
    const v = childPartInsert.call(this, node, ref);

    if (
      this._$nodes &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any)._$insertedNodes &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._$nodes.length !== (this as any)._$insertedNodes.length
    ) {
      console.log('oops!');
    }
    return v;
  };

  // Note, for node tracking, we want to record the minimum info possible
  // so if a node is added that is a part marker, do not record its
  // nodes.
  const addNode = (
    part: ShadowChildPart,
    node: NodeWithPart,
    ref: NodeWithPart | null
  ) => {
    part._$nodes ??= [];
    const nodes =
      node.nodeType === Node.DOCUMENT_FRAGMENT_NODE
        ? Array.from(node.childNodes)
        : [node];
    let skipTo: Node | undefined = undefined;
    const nodesToAdd = nodes.filter((n: NodeWithPart) => {
      if (skipTo !== undefined) {
        if (n === skipTo) {
          skipTo = undefined;
        }
        return false;
      }
      const nodes = n._$litChildPart$?._$nodes;
      skipTo = nodes ? nodes[nodes.length - 1] : undefined;
      return true;
    });
    const i = ref === part._$endNode ? Infinity : part._$nodes.indexOf(ref!);
    part._$nodes.splice(i < 0 ? Infinity : i, 0, ...nodesToAdd);
  };

  const removeNodes = (part: ShadowChildPart, start: NodeWithPart | null) => {
    part._$nodes ??= [];
    const i = Math.max(start ? part._$nodes.indexOf(start!) : 0, 0);
    // Retain before index and clear deleted items.
    part._$nodes.splice(i).forEach((n) => {
      n._$litChildPart$?._$clear();
    });
  };

  // Template patched for auto-parting.
  Template.prototype.elementPartCallback = function (
    element: Element,
    index: number
  ): ElementTemplatePart[] | undefined {
    for (const processor of ElementPartProcessors) {
      const value = processor(element);
      if (value !== undefined) {
        return [
          {
            type: ELEMENT_PART,
            index,
            value,
          },
        ];
      }
    }
    return undefined;
  };

  const baseGetTemplateInfo = Template.prototype.getTemplateInfo;
  Template.prototype.getTemplateInfo = function (
    strings: TemplateStringsArray,
    type: unknown,
    options: unknown
  ) {
    const [el, attrNames, partCount] = baseGetTemplateInfo.call(
      this,
      strings,
      type,
      options
    );
    // TODO: add these parts for reals?
    const ceCount = Array.from(el.content.querySelectorAll('*')).filter((n) =>
      (n as Element).localName.includes('-')
    ).length;
    return [el, attrNames, partCount + ceCount];
  };
};

if (DEV_MODE) {
  globalThis.litHtmlPolyfillSupportDevMode ??= polyfillSupport;
} else {
  globalThis.litHtmlPolyfillSupport ??= polyfillSupport;
}
