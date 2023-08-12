import {html} from 'lit';
import {ref} from 'lit/directives/ref.js';

html` <div
  attribute-part=${'attributeValue'}
  ?boolean-attribute-part=${true}
  .propertyPart=${'propertyValue'}
  @click=${() => console.log('EventPart')}
  ${ref(console.log)}
>
  ${'childPart'}
</div>`;
