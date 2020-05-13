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

import {isDirective} from './directive.js';
import {noChange} from './part.js';
import {AttributePart, BooleanAttributePart, isIterable, isPrimitive, NodePart, PropertyPart} from './parts.js';
import {RenderOptions} from './render-options.js';
import {parts} from './render.js';
import {templateFactory} from './template-factory.js';
import {TemplateInstance} from './template-instance.js';
import {TemplateResult} from './template-result.js';

/**
 * Information needed to rehydrate a single TemplateResult.
 *
 * TODO: this doesn't let us handle nested NodeParts that aren't the result of
 * nested templates, as repeat() creates. We need the stack to contain all
 * NodeParts for that.
 */
type NodePartState = {
  type: 'leaf';
  /** The NodePart that the result is rendered to */
  part: NodePart;
}|{
  type: 'iterable';
  /** The NodePart that the result is rendered to */
  part: NodePart;
  value: Iterable<unknown>;
  iterator: Iterator<unknown>;
  done: boolean;
}
|{
  type: 'template-instance';
  /** The NodePart that the result is rendered to */
  part: NodePart;

  result: TemplateResult;

  /** The TemplateInstance created from the TemplateResult */
  instance: TemplateInstance;

  /**
   * The index of the next Template part to be hydrated. This is mutable and
   * updated as the tree walk discovers new part markers at the right level in
   * the template instance tree.  Note there is only one Template part per
   * attribute with (one or more) bindings.
   */
  templatePartIndex: number;

  /**
   * The index of the next TemplateInstance part to be hydrated. This is used
   * to retrieve the value from the TemplateResult and initialize the
   * TemplateInstance parts' values for dirty-checking on first render.
   */
  instancePartIndex: number;
};

/**
 * hydrate() operates on a container with server-side rendered content and
 * restores the client side data structures needed for lit-html updates
 * such as TemplateInstances and Parts.
 *
 * hydrate() must be called on DOM that adheres the to lit-ssr structure for
 * parts. NodeParts must be represented with both a start and end comment
 * marker, and NodeParts that contain a TemplateInstance must have the template
 * digest written into the comment data.
 *
 * Since render() encloses its output in a NodePart, there must always be a root
 * NodePart.
 *
 * Example (using for # ... for annotations in HTML)
 *
 * Given this input:
 *
 *   html`<div class=${x}>${y}</div>`
 *
 * The SSR DOM is:
 *
 *   <!--lit-part AEmR7W+R0Ak=-->  # Start marker for the root Node Part created
 *                                 # by render(). Includes the digest of the
 *                                 # template
 *   <div class="TEST_X">
 *     <!--lit-bindings 0--> # Indicates there are attribute bindings here
 *                           # The number is the depth-first index of the parent
 *                           # node in the template.
 *     <!--lit-part-->  # Start marker for the ${x} expression
 *     TEST_Y
 *     <!--/lit-part-->  # End marker for the ${x} expression
 *   </div>
 *
 *   <!--/lit-part-->  # End marker for the root NodePart
 *
 * @param rootValue
 * @param container
 * @param userOptions
 */
export const hydrate =
    (rootValue: unknown,
     container: Element|DocumentFragment,
     userOptions?: Partial<RenderOptions>) => {
      if (parts.has(container)) {
        throw new Error('container already contains a live render');
      }

      // TODO: this matches what render() does, but we should probably reuse
      // code so that we use the same options object
      const options: RenderOptions = {
        templateFactory,
        ...userOptions,
      };

      const rootParts = hydrateContainer([rootValue], container, options);

      // Since render() creates a NodePart to render into, we'll always have
      // exactly one root part
      console.assert(
          rootParts.length === 1,
          'there should be exactly one root part in a render container');
      parts.set(container, rootParts[0]);
    };

const hydrateContainer =
    (rootValues: unknown[],
     container: Element|DocumentFragment|NodePart,
     options: RenderOptions) => {
      // When we are in-between node part markers, this is the current NodePart.
      // It's needed to be able to set the NodePart's endNode when we see a
      // close marker
      let currentNodePart: NodePart|undefined = undefined;

      // Used to remember parent template state as we recurse into nested
      // templates
      const stack: Array<NodePartState> = [];

      const rootNode = (container instanceof NodePart) ?
          container.startNode.parentNode! :
          container;

      const walker = document.createTreeWalker(
          rootNode, NodeFilter.SHOW_COMMENT, null, false);
      if (container instanceof NodePart) {
        walker.currentNode = container.startNode;
      }
      let marker: Comment|null;
      const rootParts: NodePart[] = [];
      let nextRootValue = rootValues[0];

      // Walk the DOM looking for part marker comments
      while ((marker = walker.nextNode() as Comment | null) !== null) {
        const markerText = marker.data;
        if (markerText.startsWith('lit-part')) {
          // Create a new NodePart and push it onto the stack
          let currentNode;
          ({part: currentNodePart, endNode: currentNode} =
               openNodePart(nextRootValue, marker, stack, options));
          if (stack.length === 1) {
            rootParts.push(currentNodePart);
            nextRootValue = rootValues[rootParts.length];
          }
          if (currentNode !== undefined) {
            walker.currentNode = currentNode;
          }
        } else if (markerText.startsWith('lit-bindings')) {
          // Create and hydrate attribute parts into the current NodePart on the
          // stack
          createAttributeParts(marker, stack, options);
        } else if (markerText.startsWith('/lit-part')) {
          // Close the current NodePart, and pop the previous one off the stack
          if (stack.length === 1 &&
              currentNodePart !== rootParts[rootParts.length - 1]) {
            throw new Error('internal error');
          }
          currentNodePart = closeNodePart(marker, currentNodePart, stack);
          if (currentNodePart === undefined &&
              rootParts.length === rootValues.length) {
            break;
          }
        }
      }
      if (rootParts.length !== rootValues.length) {
        throw new Error(
            'there should be as many parts in container as rootValues');
      }
      return rootParts;
    };

const openNodePart =
    (rootValue: unknown,
     marker: Comment,
     stack: Array<NodePartState>,
     options: RenderOptions) => {
      let value: unknown;
      let part;

      // Create the node part
      if (stack.length === 0) {
        part = new NodePart({
          templateFactory,
          ...options,
        });
        value = rootValue;
      } else {
        const state = stack[stack.length - 1];
        if (state.type === 'template-instance') {
          // We have a current template instance, so use its template
          // processor to create parts
          part = state.instance.processor.handleTextExpression(options);
          state.instance.__parts.push(part);
          value = state.result.values[state.instancePartIndex++];
          state.templatePartIndex++;
        } else if (state.type === 'iterable') {
          const result = state.iterator.next();
          if (result.done) {
            value = undefined;
            state.done = true;
            throw new Error('Unhandled shorter than expected iterable');
          } else {
            value = result.value;
          }
          part = new NodePart(options);
          (state.part.value as Array<NodePart>).push(part);
        } else {
          // TODO: use the closest TemplateInstance's template processor
          part = new NodePart(options);
        }
      }

      // We know the startNode now. We'll know the endNode when we get to
      // the matching marker and set it in closeNodePart()
      part.startNode = marker;

      // Initialize the NodePart state depending on the type of value and push
      // it onto the stack. This logic closely follows the NodePart commit()
      // cascade order:
      // 1. directive (not yet implemented)
      // 2. noChange
      // 3. primitive (note strings must be handled before iterables, since they
      //    are iterable)
      // 4. TemplateResult
      // 5. Node (not yet implemented, but fallback handling is fine)
      // 6. Iterable
      // 7. nothing (handled in fallback)
      // 8. Fallback for everything else
      let endNode: Node|undefined;
      part.setValue(value);
      while (isDirective(part.__pendingValue)) {
        const directive = part.__pendingValue;
        part.__pendingValue = noChange;
        const hydrate =
            (rootValues: unknown[],
             container: Element|DocumentFragment|NodePart,
             options: RenderOptions) => {
              const parts = hydrateContainer(rootValues, container, options);
              endNode = parts[parts.length - 1].endNode!;
              return parts;
            };
        directive(part, hydrate);
      }
      value = part.__pendingValue;
      if (value === noChange) {
        stack.push({part, type: 'leaf'});
      } else if (isPrimitive(value)) {
        stack.push({part, type: 'leaf'});
        part.value = value;
      } else if (value instanceof TemplateResult) {
        // Check for a template result digest
        const markerWithDigest = `lit-part ${value.digest}`;
        if (marker.data === markerWithDigest) {
          const template = options.templateFactory(value);
          const instance =
              new TemplateInstance(template, value.processor, options);
          stack.push({
            type: 'template-instance',
            instance,
            part,
            templatePartIndex: 0,
            instancePartIndex: 0,
            result: value,
          });
          // For TemplateResult values, we set the part value to the
          // generated TemplateInstance
          part.value = instance;
        } else {
          // TODO: if this isn't the server-rendered template, do we
          // need to stop hydrating this subtree? Clear it? Add tests.
          throw new Error('unimplemented');
        }
      } else if (isIterable(value)) {
        // currentNodePart.value will contain an array of NodeParts
        stack.push({
          part: part,
          type: 'iterable',
          value,
          iterator: value[Symbol.iterator](),
          done: false,
        });
        part.value = [];
      } else {
        // Fallback for everything else (nothing, Objects, Functions,
        // etc.): we just initialize the part's value
        // Note that `Node` value types are not currently supported during
        // SSR, so that part of the cascade is missing.
        stack.push({part: part, type: 'leaf'});
        part.value = value == null ? '' : value;
      }
      return {part, endNode};
    };

const closeNodePart =
    (marker: Comment, part: NodePart|undefined, stack: Array<NodePartState>):
        NodePart|undefined => {
          if (part === undefined) {
            throw new Error('unbalanced part marker');
          }
          part.endNode = marker;

          const currentState = stack.pop()!;

          if (currentState.type === 'iterable') {
            if (!currentState.iterator.next().done) {
              throw new Error('unexpected longer than expected iterable');
            }
          }

          if (stack.length > 0) {
            const state = stack[stack.length - 1];
            return state.part;
          } else {
            return undefined;
          }
        };

const createAttributeParts =
    (node: Comment, stack: Array<NodePartState>, options: RenderOptions) => {
      // Get the nodeIndex from DOM. We're only using this for an integrity
      // check right now, we might not need it.
      const match = /lit-bindings (\d+)/.exec(node.data)!;
      const nodeIndex = parseInt(match[1]);

      const state = stack[stack.length - 1];
      if (state.type === 'template-instance') {
        const instance = state.instance;
        let foundOnePart = false;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const part = instance.template.parts[state.templatePartIndex];
          if (part === undefined || part.type !== 'attribute' ||
              part.index !== nodeIndex) {
            break;
          }
          foundOnePart = true;

          const parent = node.parentElement!;
          const attributeParts = instance.processor.handleAttributeExpressions(
              parent, part.name, part.strings, options);

          // Prime the part values so subsequent dirty-checks work
          for (const attributePart of attributeParts) {
            // Set the part's current value, but only for AttributeParts,
            // not PropertyParts. This is because properties are not
            // represented in DOM so we do need to set them on initial
            // render.

            // TODO: only do this if we definitely have the same data as on
            // the server. We need a flag like `dataChanged` or `sameData`
            // for this.
            if (attributePart instanceof AttributePart &&
                !(attributePart instanceof PropertyPart)) {
              // TODO: don't use a readonly field
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (attributePart as any).value =
                  state.result.values[state.instancePartIndex++];
              attributePart.committer.dirty = false;
            } else if (attributePart instanceof BooleanAttributePart) {
              // TODO: this is ugly
              // TODO: tests
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (attributePart as any).value =
                  !!state.result.values[state.instancePartIndex++];
            }
            // Do nothing for EventPart... we need to run EventPart.commit()
            // to actually add the event listener, so we require a commit
            // Just like properties.
          }
          state.templatePartIndex++;
          instance.__parts.push(...attributeParts);
        }
        if (!foundOnePart) {
          // For a <!--lit-bindings--> marker there should be at least
          // one attribute part.
          throw new Error('internal error');
        }
      } else {
        throw new Error('internal error');
      }
    };