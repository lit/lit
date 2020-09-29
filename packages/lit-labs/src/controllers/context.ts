import {
  UpdatingController,
  UpdatingHost,
} from '../updating-controller.js';
import {
  notEqual
} from 'lit-element/lib/updating-element.js';
import { AttributePart, ATTRIBUTE_PART, directive, Directive, nothing, Part, PROPERTY_PART } from 'lit-element';

const addEvent = 'add-context';

export type ConsumerEvent = CustomEvent<Consumer>;

// TODO(sorvell): Why is this an UpdatingController?
export class Provider extends UpdatingController {
  consumers: Set<Consumer> = new Set();
  key = null;
  _value: any = null;
  // TODO(sorvell): how to type this?
  _directive?: any;

  constructor(host: UpdatingHost, value: unknown) {
    super(host);
    this.value = value;
  }

  provide() {
    if (this._directive === undefined) {
      this._directive = this._createDirective();
    }
    return this._directive();
  }

  _createDirective() {
    const provider = this;
    const ProviderDirective = class extends Directive {
      connected = false;
      render() {
        return nothing;
      }
      update(part: Part) {
        if (!(part.type === ATTRIBUTE_PART || part.type === PROPERTY_PART)) {
          throw new Error('The provide directive must be used in attribute or property position.');
        }
        if (!this.connected) {
          this.connected = true;
          provider.connect((part as AttributePart).element);
        }
        return this.render();
      }
    }
    return directive(ProviderDirective);
  }

  connect(element: HTMLElement) {
    element.addEventListener(addEvent, (event: Event) => {
      const consumer = (event as ConsumerEvent).detail;
      if (this.key !== consumer.key) {
        return;
      }
      this.consumers.add(consumer);
      consumer.value = this.value;
      consumer.provider = this;
      event.stopPropagation();
    });
    return this;
  }

  disconnect(consumer: Consumer) {
    if (this.key !== consumer.key) {
      return;
    }
    this.consumers.delete(consumer);
    consumer.provider = null;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    if (notEqual(this.value, value)) {
      this._value = value;
      for (const consumer of this.consumers) {
        consumer.value = this.value;
      }
    }
  }
}

export class Consumer extends UpdatingController {
  _value: any = null;
  provider: Provider | null = null;
  key = null;

  onConnected() {
    this.element.dispatchEvent(
      new CustomEvent(addEvent, {detail: this, composed: true, bubbles: true})
    );
  }

  onDisconnected() {
    if (this.provider) {
      this.provider.disconnect(this);
    }
  }

  get value() {
    return this._value;
  }

  set value(value) {
    if (notEqual(this.value, value)) {
      this._value = value;
      this.requestUpdate();
    }
  }
}

export const createContext = (
  initialValue: any,
  key: any,
  ProviderBase = Provider,
  ConsumerBase = Consumer
) => {
  const provider = class Provider extends ProviderBase {
    constructor(host: UpdatingHost, value: any) {
      super(host, value || initialValue);
    }
    key = key;
  };

  const consumer = class Consumer extends ConsumerBase {
    constructor(host: UpdatingHost) {
      super(host);
      this.value = initialValue;
    }
    key = key;
  };

  return {provider, consumer};
};
