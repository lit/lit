import {PropertyValues, ReactiveElement} from '../reactive-element.js';
import {property} from '../decorators/property.js';

class TSElement extends ReactiveElement {
  @property() message = 'Hi';

  @property({
    attribute: 'more-info',
    converter: (value: string | null) => `[${value}]`,
  })
  extra = '';

  update(changedProperties: PropertyValues) {
    super.update(changedProperties);
    this.innerHTML = `${this.localName} says: ${this.message} ${this.extra}`;
  }
}
customElements.define('ts-element', TSElement);
