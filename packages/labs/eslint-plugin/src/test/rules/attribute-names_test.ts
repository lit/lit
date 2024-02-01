/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ruleTester} from './rule-tester.js';
import {attributeNames} from '../../rules/attribute-names.js';

ruleTester.run('attribute-names', attributeNames, {
  valid: [
    'class Foo {}',
    `class Foo {
      static get properties() {
        return {
          whateverCaseYouWant: {type: String}
        };
      }
    }`,
    `import {LitElement} from 'lit';
     class Foo extends LitElement {
       static get properties() {
         return {
           lowercase: {type: String}
         };
       }
     }`,
    `import {LitElement} from 'lit';
     class Foo extends LitElement {
       static get properties() {
         return {
           camelCase: {type: String, attribute: 'lowercase'}
         };
       }
     }`,
    `import {LitElement} from 'lit';
     class Foo extends LitElement {
        @property({ type: String })
        lowercase = 'foo';
      }`,
    `import {LitElement} from 'lit';
     class Foo extends LitElement {
       @property({ type: String, attribute: 'lowercase' })
       camelCase = 'foo';
     }`,
    `import {LitElement} from 'lit';
     class Foo extends LitElement {
       @property({ type: String, attribute: false })
       camelCase = 'foo';
     }`,
  ],

  invalid: [
    {
      code: `import {LitElement} from 'lit';
        class Foo extends LitElement {
          static get properties() {
            return {
              camelCase: {type: String}
            };
          }
        }`,
      errors: [
        {
          line: 5,
          column: 15,
          messageId: 'casedPropertyWithoutAttribute',
        },
      ],
    },
    {
      code: `import {LitElement} from 'lit';
        class Foo extends LitElement {
          static get properties() {
            return {
              camelCase: {type: String, attribute: 'stillCamelCase'}
            };
          }
        }`,
      errors: [
        {
          line: 5,
          column: 41,
          messageId: 'casedAttribute',
        },
      ],
    },
    {
      code: `import {LitElement} from 'lit';
        import {property} from 'lit/decorators.js';
        class Foo extends LitElement {
          @property({ type: String })
          camelCase = 'foo';
        }`,
      errors: [
        {
          line: 4,
          column: 11,
          messageId: 'casedPropertyWithoutAttribute',
        },
      ],
    },
  ],
});
