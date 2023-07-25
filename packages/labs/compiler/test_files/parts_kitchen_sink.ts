import {html} from 'lit';
import {createRef, ref} from 'lit/directives/ref.js';

// Example of ElementPart
const divRef = createRef();

html` <div
  attribute-part=${'attributeValue'}
  ?boolean-attribute-part=${true}
  .propertyPart=${'propertyValue'}
  @click=${() => console.log('EventPart')}
  ${ref(divRef)}
>
  ${'childPart'}
</div>`;
