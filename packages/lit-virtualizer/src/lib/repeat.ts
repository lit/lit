import { directive, NodePart, createMarker, TemplateResult } from 'lit-html';
import { VirtualRepeater } from './uni-virtualizer/lib/VirtualRepeater.js';
import { Layout } from './uni-virtualizer/lib/layouts/Layout.js';

// TODO (graynorton): ShadyDOM polyfill doesn't support nextElementSibling (or prepend). Why not?
function nextElementSibling(node: Node) {
  let n = node.nextSibling;
  while(n && n.nodeType !== 1) {
    n = n.nextSibling;
  }
  return n;
}

/**
 * Mixin for VirtualRepeater and VirtualScroller. This mixin overrides the generic
 * methods in those classes to provide lit-specific implementations of element
 * creation and manipulation.
 *
 * This mixin implements child recycling, so children can be reused after removal
 * from the DOM.
 */
export const LitMixin = (Superclass) => class<Item> extends Superclass {
  /**
   * NodeParts that are available for reuse.
   */
  _pool: Array<NodePart>;

  /**
   * Method for generating each item's DOM.
   */
  _renderItem: (item: Item, index?: number) => TemplateResult;

  /**
   * The host of the directive that constructs the scroller. Children are
   * rendered into this part.
   */
  _hostPart: NodePart;

  constructor(config: {
    part: NodePart,
    renderItem: (item: Item, index?: number) => TemplateResult,
    useShadowDOM?: boolean,
    scrollTarget?: Element | Window,
    layout?: Layout
  }) {
    const {part, renderItem, useShadowDOM, layout} = config;
    const container = part.startNode.parentNode;
    const scrollTarget = config.scrollTarget || container;
    super({container, scrollTarget, useShadowDOM, layout});

    this._pool = [];
    this._renderItem = renderItem;
    this._hostPart = part;
  }

  createElement(): NodePart {
    return this._pool.pop() || new NodePart(this._hostPart.options);
  }

  updateElement(part: NodePart, item, idx: number) {
    part.setValue(this._renderItem(item, idx));
    part.commit();
  }

  recycleElement(part: NodePart) {
    this._pool.push(part);
  }

  /*
   * Lit-specific overrides for node manipulation
   */

  get _kids(): Array<Node> {
    return this._ordered.map((p) => nextElementSibling(p.startNode));
  }

  _node(part: NodePart): Node {
    return part.startNode;
  }

  _element(part: NodePart): Node {
    return nextElementSibling((part.startNode as Element));
  }

  _nextSibling(part: NodePart): Node {
    return part.endNode.nextSibling;
  }

  _insertBefore(part: NodePart, referenceNode: Node) {
    if (referenceNode === null) {
      referenceNode = this._hostPart.endNode;
    }
    if (!this._childIsAttached(part)) {
      // Inserting new part
      part.startNode = createMarker();
      part.endNode = createMarker();
      super._insertBefore(part.startNode, referenceNode);
      super._insertBefore(part.endNode, referenceNode);
    } else {
      // Inserting existing part
      const boundary = part.endNode.nextSibling;
      if (referenceNode !== part.startNode && referenceNode !== boundary) {
        // Part is not already in the right place
        for (let node = part.startNode; node !== boundary;) {
          const n = node.nextSibling;
          super._insertBefore(node, referenceNode);
          node = n;
        }
      }
    }
  }

  _hideChild(part: NodePart) {
    let node = part.startNode;
    while (node && node !== part.endNode) {
      super._hideChild(node);
      node = node.nextSibling;
    }
  }

  _showChild(part: NodePart) {
    let node = part.startNode;
    while (node && node !== part.endNode) {
      super._showChild(node);
      node = node.nextSibling;
    }
  }
};

export class LitRepeater<Item> extends LitMixin(VirtualRepeater)<Item> {};

interface RepeatConfig<Item> {
  renderItem: (item: Item, index?: number) => TemplateResult;
  part: NodePart;
  first?: number;
  num?: number;
  totalItems?: number;
}

const partToRepeater = new WeakMap();
export const repeat: <T>(config: RepeatConfig<T>) => (part: NodePart) => Promise<void> = directive(<T>(config: RepeatConfig<T>) => async (part: NodePart) => {
  // Retain the repeater so that re-rendering the directive's parent won't
  // create another one.
  let repeater = partToRepeater.get(part);
  if (!repeater) {
    if (!part.startNode.isConnected) {
      await Promise.resolve();
    }
    repeater = new LitRepeater<T>({part, renderItem: config.renderItem});
    partToRepeater.set(part, repeater);
  }
  const {first, num, totalItems} = config;
  Object.assign(repeater, {first, num, totalItems});
});
