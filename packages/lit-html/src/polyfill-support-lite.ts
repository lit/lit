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

export const litSlotKey = '_$litSlotDirective$';
const litChildPartKey = '_$litChildPart$';
const litShadowRootKey = '_$litShadowRoot$';
const litPartKey = '_$litPart$';
const ELEMENT_PART = 6;

interface NodeWithPart extends ChildNode {
  [litChildPartKey]?: ShadowChildPart;
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

interface SlotDirective extends Directive {
  slot: string;
  assignedNodes: () => Node[];
  distribute: () => void;
}

export interface ShadowChildPart {
  _$committedValue: unknown;
  _$startNode: NodeWithPart;
  _$endNode: ChildNode | null;
  parentNode: ParentNode;
  options: RenderOptions;
  _$setValue(value: unknown, directiveParent: DirectiveParent): void;
  _$insert<Node>(node: Node, ref: Node | null): Node;
  _$clear(start?: ChildNode | null, from?: number): void;
  _$nodes: NodeWithPart[];
  [litSlotKey]?: SlotDirective;
  _$shadowHost?: ShadowHost;
}

interface ShadowHost extends HTMLElement {
  shadowRoot: LitShadowRoot | null;
}

interface LitShadowRoot extends ShadowRoot {
  [litShadowRootKey]?: boolean;
  [litPartKey]?: ShadowChildPart;
}

interface PatchableTemplateConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): PatchableTemplate;
}

interface ShadowChildPartConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): ShadowChildPart;
}

// TODO: exported implementation; ideally goes inside polyfill function so
// it runs conditionally.

export const attachShadow = (host: HTMLElement, _config?: ShadowRootInit) => {
  if (host.shadowRoot === null) {
    // TODO This could just be an object, but we do render the marker nodes
    // into it before moving them to the host.
    const shadowRoot =
      document.createDocumentFragment() as unknown as ShadowRoot;
    Object.assign(shadowRoot, {host, [litShadowRootKey]: true});
    Object.defineProperty(host, 'shadowRoot', {
      value: shadowRoot,
      enumerable: true,
      configurable: true,
    });
  }
  return host.shadowRoot!;
};

const observerMap = new Map<HTMLElement, MutationObserver>();
const createDistributionObserver = (host: HTMLElement) => {
  const observer = new MutationObserver(() => {
    distribute(host);
  });
  observer.observe(host, {childList: true});
  observerMap.set(host, observer);
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

const distribute = (host: HTMLElement) => {
  const slots = getHostSlots(host);
  for (const s of slots) {
    s.distribute();
  }
  finishDistribution(host);
};

const slotMap = new WeakMap<HTMLElement, Set<SlotDirective>>();

// exported for testing only.
export const getHostSlots = (host: HTMLElement) => {
  let slots = slotMap.get(host);
  if (slots === undefined) {
    slotMap.set(host, (slots = new Set()));
  }
  return slots;
};

export const getPartNodes = (part: ShadowChildPart): NodeWithPart[] =>
  part._$nodes
    ? part._$nodes.flatMap((n) => [
        n,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ...(n._$litChildPart$ ? getPartNodes(n._$litChildPart$) : []),
      ])
    : [];

// Note, we do not distribute comment nodes.
const nodeMatchesSlot = (n: Node, name = '') =>
  (n.nodeType === Node.ELEMENT_NODE
    ? (n as Element).getAttribute('slot') ?? ''
    : n.nodeType !== Node.COMMENT_NODE && '') === name;

// TODO need to track static nodes
export const getLogicalNodes = (
  host: ShadowHost,
  slotName?: string | undefined
) => {
  const childNodes: Node[] = [];
  const start =
    // This property needs to remain un-minified.
    host.shadowRoot?.[litPartKey]?._$endNode!.nextSibling ??
    (host.localName === 'slot' ? host.firstChild : null);
  if (start === null) {
    return childNodes;
  }
  let skipTo: Node | undefined = undefined;
  let lightPart: ShadowChildPart | undefined;
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
    } else if (
      (lightPart = (n as NodeWithPart)[litChildPartKey]) !== undefined
    ) {
      // Filter by slot name if it's set.
      let litSlot: SlotDirective | undefined;
      if (
        slotName !== undefined &&
        (litSlot = lightPart[litSlotKey]) !== undefined
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
    const parent = this._$startNode.parentNode;
    // Note, this will be true once because we move the part markers into
    // the host.
    const parentIsShadowRoot = parent?.[litShadowRootKey];
    if (parentIsShadowRoot) {
      this._$shadowHost = setupShadowRoot(parent, this);
    }
    childPartSetValue.call(this, value, directiveParent);
    if (this._$shadowHost) {
      finishDistribution(this._$shadowHost);
    }
  };

  const setupShadowRoot = ({host}: ShadowRoot, part: ShadowChildPart) => {
    // TODO: name the markers for easier debugging
    part._$startNode.textContent = 'lit-shadow-[';
    part._$endNode = document.createComment('lit-shadow-]');
    // Most the shadowRoot part into the start of the host
    host.prepend(part._$startNode, part._$endNode);
    createDistributionObserver(host as HTMLElement);
    return host;
  };

  const shouldTrackNodes = (part: ShadowChildPart) => {
    const parent = part.parentNode ?? part._$endNode?.parentNode;
    return (
      (parent != null &&
        (parent as ShadowHost).shadowRoot?.[litShadowRootKey]) ||
      (parent as Element).localName === 'slot'
    );
  };

  const childPartClear = ChildPart.prototype._$clear;
  ChildPart.prototype._$clear = function (
    start: NodeWithPart | null = null,
    from?: number
  ) {
    start ??= this._$startNode.nextSibling;
    if (shouldTrackNodes(this)) {
      removeNodes(this, start);
    }
    childPartClear.call(this, start, from);
  };

  const childPartInsert = ChildPart.prototype._$insert;
  ChildPart.prototype._$insert = function (
    node: NodeWithPart,
    ref: NodeWithPart | null
  ) {
    if (shouldTrackNodes(this)) {
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
    const ceCount = Array.from(el.content.querySelectorAll('*')).filter(
      (n) =>
        (n as Element).localName.includes('-') ||
        (n as Element).localName == 'slot'
    ).length;
    return [el, attrNames, partCount + ceCount];
  };
};

if (DEV_MODE) {
  globalThis.litHtmlPolyfillSupportDevMode ??= polyfillSupport;
} else {
  globalThis.litHtmlPolyfillSupport ??= polyfillSupport;
}
