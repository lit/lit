import { directive, NodePart, createMarker } from 'lit-html';
import { VirtualRepeater } from './uni-virtual/lib/VirtualRepeater.js';

export const LitMixin = Superclass => class extends Superclass {
  constructor(config) {
    const {part, template} = config;
    config.container = /*config.container ||*/ part.startNode.parentNode;
    config.scrollTarget = config.scrollTarget || config.container;
    super(config);
    this._pool = [];
    this._template = template;
    this._hostPart = part;
  }

  createElement() {
    return this._pool.pop() || new NodePart(this._hostPart.options);
  }

  updateElement(part, item, idx) {
    part.setValue(this._template(item, idx));
    part.commit();
  }

  recycleElement(part) {
    this._pool.push(part);
  }

  // Lit-specific overrides for node manipulation
  get _kids() {
    return this._ordered.map(p => p.startNode.nextElementSibling);
  }

  _node(part) {
    return part.startNode;
  }

  _nextSibling(part) {
    return part.endNode.nextSibling;
  }

  _insertBefore(part, referenceNode) {
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

  _hideChild(part) {
    let node = part.startNode;
    while (node && node !== part.endNode) {
      super._hideChild(node);
      node = node.nextSibling;
    }
  }

  _showChild(part) {
    let node = part.startNode;
    while (node && node !== part.endNode) {
      super._showChild(node);
      node = node.nextSibling;
    }
  }

  _measureChild(part) {
    // Currently, we assume there's only one node in the part (between start and
    // end nodes)
    return super._measureChild(part.startNode.nextElementSibling);
  }
};

export const LitRepeater = LitMixin(VirtualRepeater);

const partToRepeater = new WeakMap();
export const repeat = directive((config = {}) => async part => {
  let repeater = partToRepeater.get(part);
  if (!repeater) {
    if (!part.startNode.isConnected) {
      await Promise.resolve();
    }
    repeater = new LitRepeater({part, template: config.template});
    partToRepeater.set(part, repeater);
  }
  const {first, num, totalItems} = config;
  Object.assign(repeater, {first, num, totalItems});
});
