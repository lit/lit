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
  value?: unknown;
  element?: HTMLElement;
  activePart: NodePart;
  inactivePart: NodePart;
}

export interface AnimateOptions {
  entry?: string;
  exit?: string;
}

const previousData = new WeakMap<NodePart, AnimateData>();

function renderValueChanged(a: any, b: any) {
  if (a instanceof TemplateResult && b instanceof TemplateResult) {
    return a.strings !== b.strings;
  } else {
    return a !== b;
  }
}

/** Finds element in-between the two given nodes. */
function findRenderedElement(start: Node, end: Node): HTMLElement | undefined {
  let current: Node | null = start;
  while (current && current.nodeType !== 1 /* Node.ELEMENT_NODE */ && current !== end) {
    current = current.nextSibling;
  }
  return current && current.nodeType === 1 /* Node.ELEMENT_NODE */ ? current as HTMLElement : undefined;
}

/**
 * Resolves when all animations on the element have finished, or when another animation was triggered.
 * @param element the element to animate on
 * @param animation the class which triggers the animation
 */
function runAnimation(el: HTMLElement, animation: string) {
  return new Promise<void>((resolve) => {
    const animations = new Set<string>();

    const done = () => {
      el.classList.remove(animation);
      el.removeEventListener('animationstart', onStart);
      el.removeEventListener('animationcancel', onEndOrCancel);
      el.removeEventListener('animationend', onEndOrCancel);
      resolve();
    };

    const onStart = (e: AnimationEvent) => {
      if (e.target === el) {
        animations.add(e.animationName)
      }
    };

    const onEndOrCancel = (e: AnimationEvent) => {
      if (!el.classList.contains(animation)) {
        // class is gone, which means this animation was raced by another
        done();
        return;
      }

      if (e.target === el) {
        animations.delete(e.animationName);
        if (animations.size === 0) {
          done();
        }
      }
    };

    el.addEventListener('animationstart', onStart);
    el.addEventListener('animationcancel', onEndOrCancel);
    el.addEventListener('animationend', onEndOrCancel);
    el.classList.add(animation);
  });
}

/**
 * Enables animating DOM nodes when they are added/removed from the DOM.
 *
 * When the template rendered by this directive changes, a class is added to the first rendered
 * element of the previous template and to the first rendered element of the new template. After
 * the animations on those elements are finished, the class is removed and the previous template is
 * removed from the DOM.
 *
 * In the options parameter you specify which class should be set to play the entry or exit animation.
 * If a value is left empty, an animation is not played for that event.
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
 *  ${animate(showFoo ? html`<div>Foo</div>` : nothing, { entry: 'foo-entry', exit: 'foo-exit' })}
 * `
 * ```
 */
export const animate = directive((value: unknown, options: AnimateOptions = {}) => (parentPart: Part) => {
  if (!(parentPart instanceof NodePart)) {
    throw new Error('animate can only be used in a NodePart');
  }
  const { entry, exit } = options;

  let data = previousData.get(parentPart);
  const initialRender = !data;

  if (!data) {
    // first render, create child parts
    data = {
      activePart: new NodePart(parentPart.options),
      inactivePart: new NodePart(parentPart.options),
    };
    previousData.set(parentPart, data);

    data.activePart.appendIntoPart(parentPart);
    data.inactivePart.appendIntoPart(parentPart);
  } else {
    if (!renderValueChanged(data.value, value)) {
      // value or template did not change, no need to run any animations
      data.activePart.setValue(value);
      data.activePart.commit();
      return;
    }

    // animate or remove previously rendered value
    const { element, activePart } = data;
    if (element) {
      if (exit) {
        // cancel any existing animation
        if (entry) {
          element.classList.remove(entry);
        }

        // animate the current element out, then remove it
        runAnimation(element, exit).then(() => {
          activePart.setValue(nothing);
          activePart.commit();
        });
      } else {
        // no need to animate, just remove it
        activePart.setValue(nothing);
        activePart.commit();
      }
    }
  }

  // swap the active/inactive parts
  const previousPart = data.activePart;
  data.activePart = data.inactivePart;
  data.inactivePart = previousPart;

  // render the new template
  data.activePart.setValue(value);
  data.activePart.commit();

  // look for the rendered element
  const element = findRenderedElement(data.activePart.startNode, data.activePart.endNode);
  data.element = element;
  data.value = value;

  // cancel an existing exit animation, this can occur when quickly toggling templates
  if (exit && element) {
    element.classList.remove(exit);
  }

  // animate rendered element if this isn't the initial render
  if (!initialRender && element && entry) {
    runAnimation(element, entry);
  }
});
