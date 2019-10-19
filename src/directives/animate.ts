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

import { directive } from "../lib/directive.js";
import { Part, nothing } from "../lib/part.js";
import { NodePart } from "../lib/parts.js";
import { TemplateResult } from "../lib/template-result.js";

export interface AnimateData {
  element?: Element;
  value?: unknown;
  activePart: NodePart;
  inactivePart: NodePart;
}

export interface AnimateOptions {
  prefix: string;
}

const previousData = new WeakMap<NodePart, AnimateData>();

function shouldAnimate(a: any, b: any) {
  if (a instanceof TemplateResult && b instanceof TemplateResult) {
    return a.strings !== b.strings;
  } else {
    return a !== b;
  }
}

/** Finds element in-between the two given nodes. */
function findRenderedElement(start: Node, end: Node): Element | undefined {
  let current: Node | null = start;
  while (current && current.nodeType !== 1 /* Node.ELEMENT_NODE */ && current !== end) {
    current = current.nextSibling;
  }
  return current && current.nodeType === 1 /* Node.ELEMENT_NODE */ ? current as Element : undefined;
}

/**
 * Enables animating DOM nodes when they are added/removed from the DOM.
 *
 * When the template rendered by this directive changes, a class is added to the first rendered
 * element of the previous template and to the first rendered element of the new template. After
 * an animation of the same name is finished, the class is removed and the previous template is
 * removed from the DOM.
 *
 * In the second parameter, a prefix must be given which is used to create the class and animation
 * name listened for.
 *
 * @param value the value to render, must be a TemplateResult if it should be animated
 * @param options animation options
 * @example:
 * ```css
 * @keyframes foo-entry {
 *   from { opacity: 0 }
 * }
 *
 * @keyframes foo-exit {
 *   to { opacity: 0 }
 * }
 *
 * .foo-entry {
 *   animation: foo-entry 300ms;
 * }
 *
 * .foo-exit {
 *   animation: foo-exit 300ms;
 * }
 * ```
 *
 * ```js
 * html`
 *  import { html, nothing } from 'lit-html';
 *  import { animate } from 'lit-html/directives/animate.js';
 *
 *  ${animate(showFoo ? html`<div>Foo</div>` : nothing, { prefix: 'foo' })}
 * `
 * ```
 */
export const animate = directive((value: unknown, options: AnimateOptions) => (parentPart: Part) => {
  if (!(parentPart instanceof NodePart)) {
    throw new Error('animate can only be used in a NodePart');
  }

  if (!options) {
    throw new Error('Missing animate options');
  }

  const entryName = `${options.prefix}-entry`;
  const exitName = `${options.prefix}-exit`;

  let data = previousData.get(parentPart);
  const initialRender = !data;

  if (!data) {
    data = {
      activePart: new NodePart(parentPart.options),
      inactivePart: new NodePart(parentPart.options),
    };
    previousData.set(parentPart, data);

    data.activePart.appendIntoPart(parentPart);
    data.inactivePart.appendIntoPart(parentPart);
  } else {
    // if we should not animate, only update the rendered value
    if (!shouldAnimate(data.value, value)) {
      data.activePart.setValue(value);
      data.activePart.commit();
      return;
    }

    // animate the current element out
    const { element, activePart } = data;
    if (element) {
      const handleEvent = (e: Event) => {
        if ((e as AnimationEvent).animationName === exitName) {
          activePart.setValue(nothing);
          activePart.commit();
          element.removeEventListener('animationend', handleEvent);
        }
      };
      element.addEventListener('animationend', handleEvent);

      element.classList.remove(entryName);
      element.classList.add(exitName);
    }
  }

  // render into the inactive part, so that the previous element can animate out
  const previousPart = data.activePart;
  data.activePart = data.inactivePart;
  data.inactivePart = previousPart;

  data.activePart.setValue(value);
  data.activePart.commit();

  const element = findRenderedElement(data.activePart.startNode, data.activePart.endNode);
  data.element = element;
  data.value = value;

  // animate rendered element if this isn't the initial render
  if (!initialRender && element) {
    const handleEvent = (e: Event) => {
      if ((e as AnimationEvent).animationName === entryName) {
        element.classList.remove(entryName);
        element.removeEventListener('animationend', handleEvent);
      }
    };
    element.addEventListener('animationend', handleEvent);

    element.classList.remove(exitName);
    element.classList.add(entryName);
  }
});
