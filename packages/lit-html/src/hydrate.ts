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
import {TemplateResult, DirectiveResult} from './lit-html.js';

import {
  noChange,
  EventPart,
  NodePart,
  PropertyPart,
  NodePartInfo,
  RenderOptions,
  ATTRIBUTE_PART,
  $private,
} from './lit-html.js';

const {
  _TemplateInstance: TemplateInstance,
  _isIterable: isIterable,
  _isPrimitive: isPrimitive,
} = $private;

type TemplateInstance = InstanceType<typeof TemplateInstance>;

const noOpCommit = () => {};

/**
 * Information needed to rehydrate a single TemplateResult.
 */
type NodePartState =
  | {
      type: 'leaf';
      /** The NodePart that the result is rendered to */
      part: NodePart;
    }
  | {
      type: 'iterable';
      /** The NodePart that the result is rendered to */
      part: NodePart;
      value: Iterable<unknown>;
      iterator: Iterator<unknown>;
      done: boolean;
    }
  | {
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
 * restores the client side data structures needed for lit-html updates such as
 * TemplateInstances and Parts. After calling `hydrate`, lit-html will behave as
 * if it initially rendered the DOM, and any subsequent updates will update
 * efficiently, the same as if lit-html had rendered the DOM on the client.
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
export const hydrate = (
  rootValue: unknown,
  container: Element | DocumentFragment,
  options: Partial<RenderOptions> = {}
) => {
  // TODO(kschaaf): Do we need a helper for $lit$ ("part for node")?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((container as any).$lit$ !== undefined) {
    throw new Error('container already contains a live render');
  }

  // Since render() creates a NodePart to render into, we'll always have
  // exactly one root part. We need to hold a reference to it so we can set
  // it in the parts cache.
  let rootPart: NodePart | undefined = undefined;

  // When we are in-between node part markers, this is the current NodePart.
  // It's needed to be able to set the NodePart's endNode when we see a
  // close marker
  let currentNodePart: NodePart | undefined = undefined;

  // Used to remember parent template state as we recurse into nested
  // templates
  const stack: Array<NodePartState> = [];

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_COMMENT,
    null,
    false
  );
  let marker: Comment | null;

  // Walk the DOM looking for part marker comments
  while ((marker = walker.nextNode() as Comment | null) !== null) {
    const markerText = marker.data;
    if (markerText.startsWith('lit-part')) {
      if (stack.length === 0 && rootPart !== undefined) {
        throw new Error('there must be only one root part per container');
      }
      // Create a new NodePart and push it onto the stack
      currentNodePart = openNodePart(rootValue, marker, stack, options);
      rootPart ??= currentNodePart;
    } else if (markerText.startsWith('lit-bindings')) {
      // Create and hydrate attribute parts into the current NodePart on the
      // stack
      createAttributeParts(marker, stack, options);
    } else if (markerText.startsWith('/lit-part')) {
      // Close the current NodePart, and pop the previous one off the stack
      if (stack.length === 1 && currentNodePart !== rootPart) {
        throw new Error('internal error');
      }
      currentNodePart = closeNodePart(marker, currentNodePart, stack);
    }
  }
  console.assert(
    rootPart !== undefined,
    'there should be exactly one root part in a render container'
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (container as any).$lit$ = rootPart;
};

const openNodePart = (
  rootValue: unknown,
  marker: Comment,
  stack: Array<NodePartState>,
  options: RenderOptions
) => {
  let value: unknown;
  // We know the startNode now. We'll know the endNode when we get to
  // the matching marker and set it in closeNodePart()
  // TODO(kschaaf): Current constructor takes both nodes
  const part = new NodePart(marker, null, options);
  if (stack.length === 0) {
    value = rootValue;
  } else {
    const state = stack[stack.length - 1];
    if (state.type === 'template-instance') {
      state.instance._parts.push(part);
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
      (state.part._value as Array<NodePart>).push(part);
    }
  }

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
  const directive =
    value != null ? (value as DirectiveResult)._$litDirective$ : undefined;
  if (directive !== undefined) {
    part._directive = new directive(part as NodePartInfo);
    value = part._directive!.update(part, (value as DirectiveResult).values);
  }
  if (value === noChange) {
    stack.push({part, type: 'leaf'});
  } else if (isPrimitive(value)) {
    stack.push({part, type: 'leaf'});
    part._value = value;
  } else if ((value as TemplateResult)._$litType$ !== undefined) {
    // Check for a template result digest
    const markerWithDigest = `lit-part ${digestForTemplateResult(
      value as TemplateResult
    )}`;
    if (marker.data === markerWithDigest) {
      const template = NodePart.prototype._getTemplate(
        (value as TemplateResult).strings,
        value as TemplateResult
      );
      const instance = new TemplateInstance(template);
      stack.push({
        type: 'template-instance',
        instance,
        part,
        templatePartIndex: 0,
        instancePartIndex: 0,
        result: value as TemplateResult,
      });
      // For TemplateResult values, we set the part value to the
      // generated TemplateInstance
      part._value = instance;
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
    part._value = [];
  } else {
    // Fallback for everything else (nothing, Objects, Functions,
    // etc.): we just initialize the part's value
    // Note that `Node` value types are not currently supported during
    // SSR, so that part of the cascade is missing.
    stack.push({part: part, type: 'leaf'});
    part._value = value == null ? '' : value;
  }
  return part;
};

const closeNodePart = (
  marker: Comment,
  part: NodePart | undefined,
  stack: Array<NodePartState>
): NodePart | undefined => {
  if (part === undefined) {
    throw new Error('unbalanced part marker');
  }

  part._endNode = marker;

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

const createAttributeParts = (
  node: Comment,
  stack: Array<NodePartState>,
  options: RenderOptions
) => {
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
      // If the next template part is in attribute-position on the current node,
      // create the instance part for it and prime its state
      const templatePart = instance._template._parts[state.templatePartIndex];
      if (
        templatePart === undefined ||
        templatePart._type !== ATTRIBUTE_PART ||
        templatePart._index !== nodeIndex
      ) {
        break;
      }
      foundOnePart = true;

      // The instance part is created based on the constructor saved in the
      // template part
      const instancePart = new templatePart._constructor(
        node.parentElement as HTMLElement,
        templatePart._name,
        templatePart._strings,
        options
      );

      const value =
        instancePart.strings === undefined
          ? state.result.values[state.instancePartIndex]
          : state.result.values;

      // Setting the attribute value primes _value with the resolved
      // directive value; we only then commit that value for event/property
      // parts since those were not serialized (passing `undefined` uses the
      // default commitValue; passing `noOpCommit` bypasses it)
      const commitValue =
        instancePart instanceof EventPart ||
        instancePart instanceof PropertyPart
          ? undefined
          : noOpCommit;
      instancePart._setValue(value, state.instancePartIndex, commitValue);
      state.templatePartIndex++;
      state.instancePartIndex += templatePart._strings.length - 1;
      instance._parts.push(instancePart);
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

// Number of 32 bit elements to use to create template digests
const digestSize = 2;
// We need to specify a digest to use across rendering environments. This is a
// simple digest build from a DJB2-ish hash modified from:
// https://github.com/darkskyapp/string-hash/blob/master/index.js
// It has been changed to an array of hashes to add additional bits.
// Goals:
//  - Extremely low collision rate. We may not be able to detect collisions.
//  - Extremely fast.
//  - Extremely small code size.
//  - Safe to include in HTML comment text or attribute value.
//  - Easily specifiable and implementable in multiple languages.
// We don't care about cryptographic suitability.
export const digestForTemplateResult = (templateResult: TemplateResult) => {
  const hashes = new Uint32Array(digestSize).fill(5381);

  for (const s of templateResult.strings) {
    for (let i = 0; i < s.length; i++) {
      hashes[i % digestSize] = (hashes[i % digestSize] * 33) ^ s.charCodeAt(i);
    }
  }
  return btoa(String.fromCharCode(...new Uint8Array(hashes.buffer)));
};
