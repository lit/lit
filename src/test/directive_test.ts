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

import {directive, Directive, PartInfo, PartType} from '../directive.js';
import {html, render} from '../lit-html.js';

const assert = chai.assert;
assert(true);

suite('Forward compatiblity directive API', () => {
  const makePartInfoTypeTestDirective = () => {
    let partInfoType: PartInfo['type']|undefined = undefined;

    class TestDirective extends Directive {
      constructor(partInfo: PartInfo) {
        super(partInfo);
        partInfoType = partInfo.type
      }

      render() {
        return undefined;
      }
    }

    return {
      directive: directive(TestDirective),
      getPartInfoType: () => partInfoType,
    };
  };

  suite('ChildPart', () => {
    test('PartInfo has the correct type.', () => {
      const {directive: testDirective, getPartInfoType} =
          makePartInfoTypeTestDirective();

      const template = document.createElement('template');
      render(html`<div>${testDirective()}</div>`, template.content);

      assert.equal(getPartInfoType(), PartType.CHILD);
    });
  });

  suite('AttributePart', () => {
    test('PartInfo has the correct type.', () => {
      const {directive: testDirective, getPartInfoType} =
          makePartInfoTypeTestDirective();

      const template = document.createElement('template');
      render(html`<div attr-name=${testDirective()}></div>`, template.content);

      assert.equal(getPartInfoType(), PartType.ATTRIBUTE);
    });
  });

  suite('PropertyPart', () => {
    test('PartInfo has the correct type.', () => {
      const {directive: testDirective, getPartInfoType} =
          makePartInfoTypeTestDirective();

      const template = document.createElement('template');
      render(html`<div .propName=${testDirective()}></div>`, template.content);

      assert.equal(getPartInfoType(), PartType.PROPERTY);
    });
  });

  suite('BooleanAttributePart', () => {
    test('PartInfo has the correct type.', () => {
      const {directive: testDirective, getPartInfoType} =
          makePartInfoTypeTestDirective();

      const template = document.createElement('template');
      render(html`<div ?attr-name=${testDirective()}></div>`, template.content);

      assert.equal(getPartInfoType(), PartType.BOOLEAN_ATTRIBUTE);
    });
  });

  suite('EventPart', () => {
    test('PartInfo has the correct type.', () => {
      const {directive: testDirective, getPartInfoType} =
          makePartInfoTypeTestDirective();

      const template = document.createElement('template');
      render(
          html`<div @event-name=${testDirective()}></div>`, template.content);

      assert.equal(getPartInfoType(), PartType.EVENT);
    });
  });
});
