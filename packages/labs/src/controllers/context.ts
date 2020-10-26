import {UpdatingController, UpdatingHost} from './updating-controller.js';
export * from './updating-controller.js';
import {notEqual} from 'updating-element';
import {
  AttributePart,
  ATTRIBUTE_PART,
  directive,
  Directive,
  nothing,
  Part,
  PROPERTY_PART,
  DirectiveClass,
  DirectiveParameters,
} from 'lit-html';

// TODO(sorvell): lit-html should export this?
declare type DirectiveResult<C extends DirectiveClass = DirectiveClass> = {
  _$litDirective$: C;
  values: DirectiveParameters<C>;
};

const connectContextEvent = 'connect-context';

const providerMap: WeakMap<Node, Provider[]> = new WeakMap();

export type ConsumerEvent = CustomEvent<Consumer[]>;

export const EVENT_STRATEGY = 1;
export const ASCEND_STRATEGY = 2;

const DEFAULT_STRATEGY = EVENT_STRATEGY;

// Note, this currently wouldn't strictly have to be an UpdatingController.
export class Provider extends UpdatingController {
  strategy = DEFAULT_STRATEGY;
  consumers: Set<Consumer> = new Set();
  key = null;

  // Note, these are not private so they can be used in mixins.
  // @internal
  _value: any = null;
  // @internal
  _directive?: () => DirectiveResult;

  constructor(host: UpdatingHost, value?: unknown) {
    super(host);
    this.value = value;
  }

  provideAll() {
    this.addConnectListener(this.element!);
  }

  provide() {
    if (this._directive === undefined) {
      const provider = this;
      const ProviderDirective = class extends Directive {
        connected = false;
        render() {
          return nothing;
        }
        update(part: Part) {
          if (!(part.type === ATTRIBUTE_PART || part.type === PROPERTY_PART)) {
            throw new Error(
              'The provide directive must be used in attribute or property position.'
            );
          }
          if (!this.connected) {
            this.connected = true;
            const element = (part as AttributePart).element;
            provider.addConnectListener(element);
          }
          return this.render();
        }
      };
      this._directive = directive(ProviderDirective);
    }
    return this._directive();
  }

  /**
   * Adds a connection listener for the given element which will connect any
   * consumers in the element's subtree to this provider.
   */
  addConnectListener(element: Node) {
    // TODO(sorvell): Multiple strategies are implemented primarily
    // to test performance.
    if (this.strategy === EVENT_STRATEGY) {
      element.addEventListener(connectContextEvent, this._connectListener);
    } else {
      providerMap.set(element, [...(providerMap.get(element) ?? []), this]);
    }
  }

  // TODO(sorvell): This should be called in the directive's `disconnect`.
  /**
   * Removes a connection listener for the given element.
   */
  removeConnectListener(element: HTMLElement) {
    element.removeEventListener(connectContextEvent, this._connectListener);
  }

  // @internal
  _connectListener = (event: Event) => {
    const consumers = (event as ConsumerEvent).detail;
    let connectedConsumers = 0;
    consumers.forEach((consumer) => {
      if (this.key !== consumer.key) {
        return;
      }
      this.connect(consumer);
      connectedConsumers++;
    });
    if (connectedConsumers === consumers.length) {
      event.stopImmediatePropagation();
    }
  };

  /**
   * Connects the given consumer to this provider.
   */
  connect(consumer: Consumer) {
    this.consumers.add(consumer);
    consumer.value = this.value;
    consumer.provider = this;
  }

  /**
   * Disconnects the given consumer from this provider.
   */
  disconnect(consumer: Consumer) {
    if (this.key !== consumer.key) {
      return;
    }
    this.consumers.delete(consumer);
    consumer.provider = undefined;
  }

  get value() {
    return this._value;
  }

  /**
   * Sets value and updates all consumers.
   */
  set value(value) {
    if (notEqual(this.value, value)) {
      this._value = value;
      // Update all consumers when value is set.
      for (const consumer of this.consumers) {
        consumer.value = this.value;
      }
    }
  }
}

const pendingConsumers: WeakMap<Element, Consumer[]> = new WeakMap();

export class Consumer extends UpdatingController {
  strategy = DEFAULT_STRATEGY;

  // @internal
  _value: any = undefined;

  provider?: Provider;
  key = null;

  constructor(host: UpdatingHost) {
    super(host);
    (window as any).controllerCount++;
  }

  /**
   * Sends connection signal to provider. The first ancestor provider with
   * the appropriate key will become this consumer's provider.
   */
  onConnected() {
    // Purely as an optimization, batch connection to update if one is pending.
    // This allows all consumers for the element to be connected with one
    // provider search.
    if (this.element!.isUpdatePending && !this.element!.hasUpdated) {
      let pending = pendingConsumers.get(this.element!);
      if (pending === undefined) {
        pendingConsumers.set(this.element!, (pending = []));
      }
      pending.push(this);
    } else {
      this._connectToProvider();
    }
  }

  // Batches connection to update if possible
  onUpdate() {
    if (!this.element!.hasUpdated && this.provider === undefined) {
      const pending = pendingConsumers.get(this.element!);
      if (pending?.length) {
        this._connectToProvider(pending);
        // pending consumers get one shot to find a provider.
        pending.length = 0;
      }
    }
  }

  // @internal
  _connectToProvider(consumers: Consumer[] = [this]) {
    // TODO(sorvell): Multiple strategies are implemented primarily
    // to test performance.
    // Find provider by firing event.
    if (this.strategy === EVENT_STRATEGY) {
      (window as any).eventCount++;
      this.element!.dispatchEvent(
        new CustomEvent(connectContextEvent, {
          detail: consumers,
          composed: true,
          bubbles: true,
        })
      );
      // Or ascend tree to find provider.
    } else {
      let node: Node = this.element!;
      let connectedCount = 0;
      while ((node = node.parentNode ?? (node as ShadowRoot).host)) {
        const providers = providerMap.get(node);
        if (providers !== undefined) {
          // Try to find a provider for the consumers.
          for (let i = 0; i < consumers.length; i++) {
            const consumer = consumers[i];
            const provider = providers.find(
              (provider) => provider.key === consumer.key
            );
            // If a provider is found, connect the consumer and remove it from
            // our search list.
            if (provider !== undefined) {
              provider.connect(consumer);
              connectedCount++;
            }
          }
        }
        if (connectedCount === consumers.length) {
          break;
        }
      }
    }
  }

  /**
   * Disconnects from the provider.
   */
  onDisconnected() {
    this.provider?.disconnect(this);
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

/**
 * Creates a context helper that allows indirectly passing data down the
 * element tree. The `options` argument is an object which should provide a
 * `key` for the data and optionally an `initialValue` to set. In addition,
 * custom Consumer and Provider classes can be provided. Example usage:
 *
 * const MyContext = createContext({key: 'some-data', initialValue: 'hi'});
 *
 * class MyElement extends LitElement {
 *   constructor() {
 *     super();
 *     this.myProvider = new MyContext.provider(this);
 *     // to provide to the entire subtree
 *     // this.myProvider.provideAll();
 *   }
 *
 *   render() {
 *     return html`<div ${this.myProvider.provide()} @click=${this._clickHandler}>
 *       <my-item></my-item>
 *       <my-item></my-item>
 *     </div>`;
 *   }
 *
 *   _clickHandler() {
 *     // sends value to all consumers
 *     this.myProvider.value = 'hi';
 *   }
 * }
 *
 * class MyItem extends LitElement {
 *   constructor() {
 *     super();
 *     this.myConsumer = new MyContext.consumer(this);
 *   }
 *
 *   render() {
 *     return html`${this.myConsumer.value}`;
 *   }
 *
 * }
 *
 */
export const createContext = (
  {key, initialValue}: {initialValue?: any; key: any},
  // TODO(sorvell): how to type this if these are provided in the options argument
  ProviderBase = Provider,
  ConsumerBase = Consumer
) => {
  const provider = class Provider extends ProviderBase {
    constructor(host: UpdatingHost, value?: any) {
      super(host, value || initialValue);
    }
    key = key;
  };

  const consumer = class Consumer extends ConsumerBase {
    key = key;
  };

  return {provider, consumer};
};
