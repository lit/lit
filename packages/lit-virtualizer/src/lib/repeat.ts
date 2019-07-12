import { directive, NodePart, createMarker, TemplateResult } from 'lit-html';
import { VirtualRepeater } from './uni-virtualizer/lib/VirtualRepeater';
import { Layout } from './uni-virtualizer/lib/layouts/Layout';

/**
 * Mixin for VirtualRepeater and VirtualScroller. This mixin overrides the generic
 * methods in those classes to provide lit-specific implementations of element
 * creation and manipulation.
 * 
 * This mixin implements child recycling, so children can be reused after removal
 * from the DOM.
 */
export const LitMixin = Superclass => class extends Superclass {
  // NodeParts that are available for reuse.
  _pool: Array<NodePart>;

  // Method for generating each item's DOM.
  _renderItem: (item: any, index?: number) => TemplateResult;

  // Children are rendered into this part.
  // The host of the directive that constructs the scroller.
  _hostPart: NodePart;
  
  /**
   * TODO @straversi: This is not a true mixin. Mixins do have information
   * about potential superclasses. This class appears to know the constructor
   * arguments of an unknown superclass. It also overrides methods on an
   * unknown superclass.
   */
  constructor(config: {
    part: NodePart,
    renderItem: (item: any, index?: number) => TemplateResult,
    useShadowDOM?: boolean,
    scrollTarget?: Element | Window,
    layout?: Layout
  }) {
    const {part, renderItem, useShadowDOM, layout} = config;
    let container = part.startNode.parentNode;
    let scrollTarget = config.scrollTarget || container;
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
    return this._ordered.map(p => p.startNode.nextElementSibling);
  }

  _node(part: NodePart): Node {
    return part.startNode;
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

  _measureChild(part: NodePart) {
    // Currently, we assume there's only one node in the part (between start and
    // end nodes)
    return super._measureChild((part.startNode as Element).nextElementSibling);
  }
};

export const LitRepeater = LitMixin(VirtualRepeater);

interface RepeatConfig {
  renderItem: (item: any, index?: number) => TemplateResult,
  part: NodePart,
  first?: number,
  num?: number,
  totalItems?: number,
}

const partToRepeater = new WeakMap();
export const repeat = directive((config: RepeatConfig) => async (part: NodePart) => {
  // Retain the repeater so that re-rendering the directive's parent won't
  // create another one.
  let repeater = partToRepeater.get(part);
  if (!repeater) {
    if (!part.startNode.isConnected) {
      await Promise.resolve();
    }
    repeater = new LitRepeater({part, renderItem: config.renderItem});
    partToRepeater.set(part, repeater);
  }
  const {first, num, totalItems} = config;
  Object.assign(repeater, {first, num, totalItems});
});
