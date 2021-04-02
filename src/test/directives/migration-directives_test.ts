/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved.
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

import {Directive, directive, DirectiveParameters, Part, PartInfo, PartType,} from '../../directive.js';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Adds the length of the parent or current node's tag name to the given value
 * on update.
 *
 * @example
 * html`<span>${addParentLength(3)}</span>` => <span>7</span>
 */
class AddParentLengthDirective extends Directive {
  _targetEl: Element|null = null;

  render(value: number) {
    return value;
  }

  update(part: Part, [value]: DirectiveParameters<this>) {
    const hasPrevTarget = !!this._targetEl;

    if (!hasPrevTarget) {
      switch (part.type) {
        case PartType.ATTRIBUTE:
        case PartType.PROPERTY:
          this._targetEl = part.element;
          break;
        case PartType.CHILD:
          this._targetEl = part.parentNode as Element;
          break;
        default:
          throw new Error(
              `${part.name} is not supported for parent length directive`);
      }
    }

    const parentNameLength = this._targetEl!.tagName.length;
    return this.render(value + parentNameLength);
  }
}

/**
 * Returns the given string plus number of updates.
 *
 * @example
 * updateCounter('foo') // foo:0
 */
class UpdateCounterDirective extends Directive {
  _numUpdates = 0;

  constructor(partInfo: PartInfo) {
    super(partInfo);

    if (partInfo.type !== PartType.CHILD) {
      throw new Error('updateCounter directive only supports child parts');
    }
  }

  render(str: string) {
    return `${str}:${this._numUpdates++}`;
  }
}

const addParentLength = directive(AddParentLengthDirective);
const updateCounter = directive(UpdateCounterDirective);

/**
 * Fetches the textContent of a node, srips out lit comments and trims it.
 *
 * @param node Node of which to normalize text content
 */
const getAndNormalizeTextContent = (node: Node) => {
  return stripExpressionMarkers(node.textContent!).trim();
};

suite('migration directives', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  suite('Works on:', () => {
    test('Attribute part bindings', () => {
      const template = html` <div
        data-length=${addParentLength(5)}
      ></div>`;
      render(template, container);

      const el = container.firstElementChild as HTMLDivElement;
      const length = el.getAttribute('data-length');
      assert.equal(length, '8');
    });

    test('boolean attribute part bindings', () => {
      const template = html` <article ?bool=${addParentLength(5)}></article>`;
      const renderTemplate = () => render(template, container);

      assert.throws(renderTemplate);
    });

    test('property part bindings', () => {
      const template = html` <input .value=${addParentLength(5)} >`;
      render(template, container);

      const el = container.firstElementChild as HTMLInputElement;
      assert.equal(el.value, '10');
    });

    test('child part bindings', () => {
      const template = html` <article>${addParentLength(5)}</article>`;
      render(template, container);

      const el = container.firstElementChild as HTMLInputElement;
      const length = getAndNormalizeTextContent(el);
      assert.equal(length, '12');
    });

    test('event part bindings', () => {
      const template = html` <article @event=${addParentLength(5)}></article>`;
      const renderTemplate = () => render(template, container);

      assert.throws(renderTemplate);
    });
  });

  test('part cache is not cleared by other directives', () => {
    const renderDirective = (val: number|string) => {
      let directive;

      if ((val as string)?.length !== undefined) {
        directive = updateCounter(val as string);
      } else {
        directive = addParentLength(val as number);
      }

      const template = html`
          <my-el>${directive}</my-el>`;

      render(template, container);
    };

    // Render with updateCounter directive
    renderDirective('foo');
    let el = container.firstElementChild as HTMLInputElement;
    assert.equal(getAndNormalizeTextContent(el), 'foo:0');

    // Render with addParentName directive
    renderDirective(3);
    el = container.firstElementChild as HTMLInputElement;
    assert.equal(getAndNormalizeTextContent(el), '8');

    // Render with the first updateCounter see no fresh state vs Lit 2
    renderDirective('bar');
    el = container.firstElementChild as HTMLInputElement;
    assert.equal(getAndNormalizeTextContent(el), 'bar:1');
  });

  test('state preseved across renders', () => {
    const renderDirective = (str: string) =>
        render(html`<div>${updateCounter(str)}</div>`, container);

    // Initial render with updateCounter
    renderDirective('hello');
    const el = container.firstElementChild as HTMLInputElement;
    let content = getAndNormalizeTextContent(el);
    assert.equal(content, 'hello:0');

    // Internal directive state is preserved
    renderDirective('world');
    content = getAndNormalizeTextContent(el);
    assert.equal(content, 'world:1');

    // Ensure update is triggered with no change in argument
    renderDirective('world');
    content = getAndNormalizeTextContent(el);
    assert.equal(content, 'world:2');
  });
});
