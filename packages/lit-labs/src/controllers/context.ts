import {
  UpdatingController,
  UpdatingHost,
} from 'lit-element/lib/updating-controller.js';

const addEvent = 'add-context';
const removeEvent = 'remove-context';

export type ConsumerEvent = CustomEvent<Consumer>;

export class Provider extends UpdatingController {
  consumers: Set<Consumer> = new Set();
  key = null;
  _value: any = null;

  constructor(host: UpdatingHost, value: unknown) {
    super(host);
    this.value = value;
    this.element.addEventListener(addEvent, (event: Event) =>
      this.onAddContext(event as ConsumerEvent)
    );
    this.element.addEventListener(removeEvent, (event: Event) =>
      this.onRemoveContext(event as ConsumerEvent)
    );
  }

  onAddContext(event: ConsumerEvent) {
    const consumer = event.detail;
    if (this.key !== consumer.key) {
      return;
    }
    this.consumers.add(consumer);
    consumer.value = this.value;
    consumer.provider = this;
    event.stopPropagation();
  }

  onRemoveContext(event: ConsumerEvent) {
    const consumer = event.detail;
    if (this.key !== consumer.key) {
      return;
    }
    this.consumers.delete(consumer);
    consumer.provider = null;
    event.stopPropagation();
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    for (const consumer of this.consumers) {
      consumer.value = this.value;
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
      this.provider.element.dispatchEvent(
        new CustomEvent(removeEvent, {detail: this})
      );
    }
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    this.requestUpdate();
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
