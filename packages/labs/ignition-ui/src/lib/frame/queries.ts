import {ChildPart, TemplateInstance} from 'lit-html';

type LitTemplate = InstanceType<typeof TemplateInstance>['_$template'];
type MaybeRootLitContainer = Element & {_$litPart$: ChildPart | undefined};

/**
 * Given an element `el`, this function will try and locate the lit-html
 * `Template` which contains `el`.
 */
export function locateLitTemplate(el: HTMLElement): LitTemplate | null {
  let rootEl: MaybeRootLitContainer | null =
    el as unknown as MaybeRootLitContainer;
  while (rootEl != null && rootEl['_$litPart$'] == null) {
    if (rootEl instanceof ShadowRoot) {
      rootEl = rootEl.host as unknown as MaybeRootLitContainer;
    } else {
      rootEl = rootEl.parentNode as unknown as MaybeRootLitContainer;
    }
  }
  if (rootEl == null) {
    return null;
  }
  const rootChildPart: ChildPart = rootEl['_$litPart$']!;
  const elToPartBoundaries = getPartBoundaries(rootChildPart);

  // Walk all nodes, maintaining a stack of ChildParts. The top ChildPart will
  // contain the TemplateInstance for the given node.
  const partsStack: ChildPart[] = [];
  for (const val of piercingWalkNodes(rootEl)) {
    const {node, type} = val;
    const associatedChildPart = elToPartBoundaries.get(node);
    if (associatedChildPart) {
      if (type === 'opening') {
        if (associatedChildPart.startNode === node) {
          partsStack.push(associatedChildPart);
        }
      }
      if (type === 'closing') {
        // If on a ChildPart endNode or parentNode close the ChildPart.
        if (
          associatedChildPart.endNode === node ||
          associatedChildPart.parentNode === node
        ) {
          if (partsStack[partsStack.length - 1] !== associatedChildPart) {
            throw new Error(`Parts are out of sync on endNode`);
          }
          partsStack.pop();
        }
      }
    }

    if (el === node) {
      const templateInstance =
        partsStack[partsStack.length - 1]._$committedValue;
      if (!isTemplateInstance(templateInstance)) {
        throw new Error(
          `Expect ChildPart containing queried element to contain a committed TemplateInstance.`
        );
      }
      return templateInstance._$template;
    }
  }
  return null;
}

/**
 * This function traverses *only* ChildParts, and annotates the boundary Nodes
 * so we can traverse the DOM and know which ChildPart we are within.
 */
function getPartBoundaries(rootPart: ChildPart): ReadonlyMap<Node, ChildPart> {
  const elToPartBoundaries = new Map<Node, ChildPart>();

  function markTemplateBoundaries(part: ChildPart) {
    elToPartBoundaries.set(part.startNode!, part);
    if (part.endNode) {
      elToPartBoundaries.set(part.endNode, part);
    } else {
      // If the part doesn't have an endNode, we should mark its parent so we
      // can close it.
      elToPartBoundaries.set(part.parentNode, part);
    }
    if (!isTemplateInstance(part._$committedValue)) {
      return;
    }
    const {_$parts} = part._$committedValue;
    for (const part of _$parts) {
      // Only traverse ChildParts
      if (part?.type !== 2) {
        continue;
      }
      markTemplateBoundaries(part);
    }
    return;
  }

  markTemplateBoundaries(rootPart);
  return elToPartBoundaries;
}

/**
 * Use this instead of `instanceof` to detect the shape of a TemplateInstance.
 */
function isTemplateInstance(obj: unknown): obj is TemplateInstance {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    '_$parts' in obj &&
    '_$template' in obj
  );
}

interface TraversalNode extends Node {
  localName?: string;
  host?: Element;
  assignedSlot?: InstanceType<typeof Element>['assignedSlot'];
  shadowRoot?: InstanceType<typeof Element>['shadowRoot'];
}

interface NodeWithTraversalInfo {
  node: Node;
  type: 'opening' | 'closing';
}

/**
 * Piercing node walk.
 */
function* piercingWalkNodes(
  node: TraversalNode
): IterableIterator<NodeWithTraversalInfo> {
  yield {node, type: 'opening'};
  if (node.localName === 'slot') {
    const slot = node as HTMLSlotElement;
    for (const childNode of slot.assignedNodes({flatten: true})) {
      yield* piercingWalkNodes(childNode);
    }
  }
  const childNodes = node.shadowRoot?.childNodes ?? node.childNodes;
  for (const childNode of childNodes) {
    yield* piercingWalkNodes(childNode);
  }
  yield {node, type: 'closing'};
}
