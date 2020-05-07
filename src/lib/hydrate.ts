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

import {AttributePart, BooleanAttributePart, isIterable, NodePart, PropertyPart} from './parts.js';
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
   * The index of the next part/value to be hydrated. This is mutable and
   * updated as the tree walk discovers new part markers at the right level in
   * the template instance tree. It's used to up a TemplatePart from the
   * template, and to retreive the associated value from the TemplateResult.
   */
  currentPartIndex: number;
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

      // Since render() creates a NodePart to render into, we'll always have
      // exactly one root part. We need to hold a reference to it so we can set
      // it in the parts cache.
      let rootPart: NodePart|undefined = undefined;

      // When we are in-between node part markers, this is the current NodePart.
      // It's needed to be able to set the NodePart's endNode when we see a
      // close marker
      let currentNodePart: NodePart|undefined = undefined;

      // Used to remember parent template state as we recurse into nested
      // templates
      const stack: Array<NodePartState> = [];

      const walker = document.createTreeWalker(
          container, NodeFilter.SHOW_COMMENT, null, false);
      let node: Comment|null;

      // Walk the DOM looking for part marker comments
      while ((node = walker.nextNode() as Comment | null) !== null) {
        const data = node.data;

        if (data.startsWith('lit-part')) {
          // This is an NodePart opening marker
          let value: unknown;

          if (stack.length === 0) {
            // We don't have a parent part, so this must be the root part
            if (rootPart !== undefined) {
              throw new Error('there must be only one root part per container');
            }
            rootPart = currentNodePart = new NodePart({
              templateFactory,
              ...options,
            });
            value = rootValue;
          } else {
            const state = stack[stack.length - 1];

            if (state.type === 'template-instance') {
              // We have a current template instace, so use its template
              // processor to create parts
              currentNodePart =
                  state.instance.processor.handleTextExpression(options);
              state.instance.__parts.push(currentNodePart);
              value = state.result.values[state.currentPartIndex];
              state.currentPartIndex++;
            } else if (state.type === 'iterable') {
              const result = state.iterator.next();
              if (result.done) {
                value = undefined;
                state.done = true;
                throw new Error('Unhandled shorter than expected iterable');
              } else {
                value = result.value;
              }
              currentNodePart = new NodePart(options);
              (state.part.value as Array<NodePart>).push(currentNodePart);
            } else {
              // TODO: use the closest TemplateInstance's template processor
              currentNodePart = new NodePart(options);
            }
          }

          // We know the startNode now. We'll know the endNode when we get to
          // the matching marker.
          currentNodePart.startNode = node;

          // Check for a template result digest
          if (value instanceof TemplateResult) {
            const markerWithDigest = `lit-part ${value.digest}`;
            if (data === markerWithDigest) {
              const template = options.templateFactory(value);
              const instance =
                  new TemplateInstance(template, value.processor, options);
              stack.push({
                type: 'template-instance',
                instance,
                part: currentNodePart,
                currentPartIndex: 0,
                result: value,
              });
              // For TemplateResult values, we set the part value to the
              // generated TemplateInstance
              currentNodePart.value = instance;
            } else {
              // TODO: if this isn't the server-rendered template, do we
              // need to stop hydrating this subtree? Clear it? Add tests.
              throw new Error('unimplemented');
            }
          } else {
            if (typeof value === 'string') {
              // TODO: implement the rest of the NodePart commit() cascade. Can
              // we reuse the code?
              stack.push({part: currentNodePart, type: 'leaf'});
              currentNodePart.value = value;
            } else if (isIterable(value)) {
              // currentNodePart.value will contain an array of NodeParts
              stack.push({
                part: currentNodePart,
                type: 'iterable',
                value,
                iterator: value[Symbol.iterator](),
                done: false,
              });
              currentNodePart.value = [];
            } else {
              stack.push({part: currentNodePart, type: 'leaf'});
            }
          }
        } else if (data.startsWith('/lit-part')) {
          // This is an NodePart closing marker
          if (currentNodePart === undefined) {
            throw new Error('unbalanced part marker');
          }
          currentNodePart.endNode = node;

          const currentState = stack.pop()!;

          if (currentState.type === 'iterable') {
            if (!currentState.iterator.next().done) {
              throw new Error('unexpected longer than expected iterable');
            }
          }

          // If we empty the stack, make sure the last state is for the root
          // part
          if (stack.length === 0) {
            if (currentState.part !== rootPart) {
              throw new Error('internal error');
            }
          } else {
            const state = stack[stack.length - 1];
            currentNodePart = state.part;
          }
        } else if (data.startsWith('lit-bindings')) {
          // The parent node has attribute bindings

          // Get the nodeIndex from DOM. We're only using this for an integrety
          // check right now, we might not need it.
          const match = /lit-bindings (\d+)/.exec(data)!;
          const nodeIndex = parseInt(match[1]);

          const state = stack[stack.length - 1];
          if (state.type === 'template-instance') {
            const instance = state.instance;
            let foundOnePart = false;
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const part = instance.template.parts[state.currentPartIndex];
              if (part === undefined || part.type !== 'attribute' ||
                  part.index !== nodeIndex) {
                break;
              }
              foundOnePart = true;

              const parent = node.parentElement!;
              const attributeParts =
                  instance.processor.handleAttributeExpressions(
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
                      state.result.values[state.currentPartIndex];
                  attributePart.committer.dirty = false;
                } else if (attributePart instanceof BooleanAttributePart) {
                  // TODO: this is ugly
                  // TODO: tests
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (attributePart as any).value =
                      !!state.result.values[state.currentPartIndex];
                }
                // Do nothing for EventPart... we need to run EventPart.commit()
                // to actually add the event listener, so we require a commit
                // Just like properties.
                state.currentPartIndex++;
              }
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
        }
      }
      console.assert(
          rootPart !== undefined,
          'there should be exactly one root part in a render container');
      parts.set(container, rootPart!);
    };
