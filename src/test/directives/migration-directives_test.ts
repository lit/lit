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

/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />

import {Directive, directive, DirectiveParameters, Part, PartInfo, PartType,} from '../../directive.js';
import {render} from '../../lib/render.js';
import {html} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * adds the length of the parent /current node's tag name to the given value on
 * update. e.g. <span>${addParentLength(3)}</span> => <span>7</span>
 */
class AddParentLengthDirective extends Directive {
  _targetEl: Element|null = null;

  render(value: number) {
    return value.toString();
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
 * concats the parent / current element's tag name to the given value on update.
 * e.g. <span>${addParentName(3)}</span> => <span>3 span</span>
 */
class AddParentNameDirective extends Directive {
  _targetEl: Element|null = null;

  render(value: string|number) {
    return value.toString();
  }

  update(part: Part, [value]: DirectiveParameters<this>) {
    const hasPrevTarget = !!this._targetEl;

    if (!hasPrevTarget) {
      switch (part.type) {
        case PartType.ATTRIBUTE:
        case PartType.BOOLEAN_ATTRIBUTE:
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

    const parentName = this._targetEl!.tagName.toLocaleLowerCase();
    return this.render(`${value} ${parentName}`);
  }
}

class UpdateCounterDirective extends Directive {
  _numUpdates = 0;

  constructor(partInfo: PartInfo) {
    super(partInfo);

    if (partInfo.type !== PartType.CHILD) {
      throw new Error('updateCounter directive only supports child parts');
    }
  }

  update(_part: Part, [str]: DirectiveParameters<this>) {
    this._numUpdates++;
    return this.render(`updates: ${this._numUpdates} input: ${str}`);
  }

  render(str: string) {
    return str;
  }
}

const addParentLength = directive(AddParentLengthDirective);
const addParentName = directive(AddParentNameDirective);
const updateCounter = directive(UpdateCounterDirective);

suite('migration directives', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  suite('Each Part Type', () => {
    test('ATTRIBUTE', () => {
      const template = html` <div
        data-length=${addParentLength(5)}
        data-name=${addParentName(5)}
      ></div>`;
      render(template, container);

      const el = container.firstElementChild as HTMLDivElement;
      const length = el.getAttribute('data-length');

      assert.equal(length, '8');

      const name = el.getAttribute('data-name');

      assert.equal(name, '5 div');
    });

    test('BOOLEAN_ATTIBUTE', () => {
      const template = html` <article ?bool=${addParentLength(5)}></article>`;
      const renderTemplate = () => render(template, container);

      assert.throws(renderTemplate);
    });

    test('PROPERTY', () => {
      const template = html` <input .value=${addParentLength(5)} />
        <input .value=${addParentName(5)} />`;
      render(template, container);

      const el = container.firstElementChild as HTMLInputElement;
      const el2 = container.lastElementChild as HTMLInputElement;

      const length = el.value;

      assert.equal(length, '10');

      const name = el2.value;

      assert.equal(name, '5 input');
    });

    test('CHILD', () => {
      const template = html` <article>${addParentLength(5)}</article>
        <article>${addParentName(5)}</article>`;
      render(template, container);

      const el = container.firstElementChild as HTMLInputElement;
      const el2 = container.lastElementChild as HTMLInputElement;

      const length = stripExpressionMarkers(el.textContent!).trim();

      assert.equal(length, '12');

      const name = stripExpressionMarkers(el2.textContent!).trim();

      assert.equal(name, '5 article');
    });

    test('EVENT', () => {
      const template = html` <article @event=${addParentLength(5)}></article>`;
      const renderTemplate = () => render(template, container);

      assert.throws(renderTemplate);
    });
  });

  test('part caching', () => {
    const renderDirective = (val: number, useName = false) => {
      let directive;

      if (useName) {
        directive = addParentName(val);
      } else {
        directive = addParentLength(val);
      }

      const template = html`
          <input .value=${(directive as unknown) as string}></input>`;

      render(template, container);
    };

    renderDirective(3);

    let el = container.firstElementChild as HTMLInputElement;

    assert.equal(el.value, '8');

    renderDirective(4, true);

    el = container.firstElementChild as HTMLInputElement;

    assert.equal(el.value, '4 input');

    renderDirective(5);

    el = container.firstElementChild as HTMLInputElement;

    assert.equal(el.value, '10');
  });

  test('state preseved across renders', () => {
    const renderDirective = (str: string) =>
        render(html`<div>${updateCounter(str)}</div>`, container);


    renderDirective('hello');
    const el = container.firstElementChild as HTMLInputElement;
    let content = stripExpressionMarkers(el.textContent!).trim();
    assert.equal(content, 'updates: 1 input: hello');

    renderDirective('world');
    content = stripExpressionMarkers(el.textContent!).trim();
    assert.equal(content, 'updates: 2 input: world');

    renderDirective('world');
    content = stripExpressionMarkers(el.textContent!).trim();
    assert.equal(content, 'updates: 3 input: world');
  });
});
