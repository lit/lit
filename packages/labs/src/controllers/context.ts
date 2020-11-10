import {UpdatingController} from './updating-controller.js';
export * from './updating-controller.js';
import {notEqual, UpdatingElement} from 'updating-element';
import {
  AttributePart,
  ATTRIBUTE_PART,
  directive,
  Directive,
  nothing,
  Part,
  PROPERTY_PART,
  DirectiveResult,
} from 'lit-html';

const providerMap: WeakMap<Node, Provider[]> = new WeakMap();

export class ProvideContextEvent extends Event {
  consumer: Consumer;

  static eventName = 'provide-context';

  constructor(consumer: Consumer, options: EventInit) {
    super(ProvideContextEvent.eventName, options);
    this.consumer = consumer;
  }
}

export const EVENT_STRATEGY = 1;
export const ASCEND_STRATEGY = 2;

const DEFAULT_STRATEGY = EVENT_STRATEGY;

// Note, this currently wouldn't strictly have to be an UpdatingController.
export class Provider {
  // TODO(sorvell): Multiple strategies are implemented primarily
  // to test performance.
  strategy = DEFAULT_STRATEGY;
  host: UpdatingElement;
  consumers: Set<Consumer> = new Set();
  key: object | null = null;

  // Note, these are not private so they can be used in mixins.
  // @internal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _value: any;

  // @internal
  _directive?: () => DirectiveResult;

  /**
   * If set to true, this provider can be overridden by providers above
   * it in the tree.
   */
  allowOverride = false;

  constructor(host: UpdatingElement, value?: unknown) {
    this.host = host;
    this.value = value;
  }

  provideAll() {
    // TODO(sorvell): this will connect light DOM children, which is likely not desirable.
    // However, `renderRoot` is not available until connected.
    this.addConnectListener(this.host);
  }

  /**
   * Returns a directive which provides this value to the subtree to which
   * the directive is attached.
   */
  provide() {
    if (this._directive === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
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
    return this._directive!();
  }

  /**
   * Adds a connection listener for the given element which will connect any
   * consumers in the element's subtree to this provider.
   */
  addConnectListener(element: Node) {
    if (this.strategy === EVENT_STRATEGY) {
      element.addEventListener(
        ProvideContextEvent.eventName,
        this._connectListener
      );
    } else {
      providerMap.set(element, [...(providerMap.get(element) ?? []), this]);
    }
  }

  // TODO(sorvell): This should be called in the directive's `disconnect`.
  /**
   * Removes a connection listener for the given element.
   */
  removeConnectListener(element: HTMLElement) {
    element.removeEventListener(
      ProvideContextEvent.eventName,
      this._connectListener
    );
  }

  // @internal
  _connectListener = (event: Event) => {
    const consumer = (event as ProvideContextEvent).consumer;
    if (this.key !== consumer.key) {
      return;
    }
    if (this.connect(consumer)) {
      event.stopImmediatePropagation();
    }
  };

  /**
   * Connects the given consumer to this provider, first disconnecting it from
   * any previous provider.
   * @returns Returns true if this provider provides the value and does not
   * allow it to be overridden by ancestor providers.
   */
  connect(consumer: Consumer) {
    const existingProvider = consumer.provider;
    if (existingProvider) {
      if (existingProvider.allowOverride) {
        existingProvider.disconnect(consumer);
      } else {
        return true;
      }
    }
    this.consumers.add(consumer);
    consumer._setValue(this.value);
    consumer.provider = this;
    return !this.allowOverride;
  }

  /**
   * Disconnects the given consumer from this provider.
   */
  disconnect(consumer: Consumer) {
    if (this.key === consumer.key) {
      this.consumers.delete(consumer);
      consumer.provider = undefined;
    }
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
        consumer._setValue(this.value);
      }
    }
  }
}

export class Consumer extends UpdatingController {
  // TODO(sorvell): Multiple strategies are implemented primarily
  // to test performance.
  strategy = DEFAULT_STRATEGY;

  // @internal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _value: any = undefined;

  provider?: Provider;
  key: object | null = null;

  /**
   * Sends connection signal to provider. The first ancestor provider with
   * the appropriate key will become this consumer's provider.
   */
  connectedCallback() {
    if (this.provider === undefined) {
      this._connectToProvider(this);
    }
  }

  // @internal
  _connectToProvider(consumer: Consumer) {
    // Find provider by firing event.
    if (this.strategy === EVENT_STRATEGY) {
      this.host.dispatchEvent(
        new ProvideContextEvent(consumer, {
          composed: true,
          bubbles: true,
        })
      );
      // Or ascend tree to find provider.
    } else {
      let node: Node = this.host;
      while ((node = node.parentNode ?? (node as ShadowRoot).host)) {
        const providers = providerMap.get(node);
        if (providers === undefined) {
          continue;
        }
        // Try to find a provider for the consumers.
        const provider = providers.find(
          (provider) => provider.key === consumer.key
        );
        // If a provider is found, connect the consumer.
        if (provider !== undefined) {
          if (provider.connect(consumer)) {
            break;
          }
        }
      }
    }
  }

  /**
   * Disconnects from the provider.
   */
  disconnectedCallback() {
    this.provider?.disconnect(this);
  }

  get value() {
    return this._value;
  }

  // @internal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _setValue(value: any) {
    if (notEqual(this.value, value)) {
      this._value = value;
      this.requestUpdate();
    }
  }
}

/**
 * Creates a context helper that allows indirectly passing data down the
 * element tree. The `options` argument is an object which can optionally an
 * `initialValue` to set. In addition, custom Consumer and Provider classes
 * can be provided. Example usage:
 *
 * const MyContext = createContext({initialValue: 'hi'});
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
  {
    initialValue,
    allowOverride = false,
    ProviderClass = Provider,
    ConsumerClass = Consumer,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialValue?: any;
    allowOverride?: boolean;
    ProviderClass?: typeof Provider;
    ConsumerClass?: typeof Consumer;
  } = {
    allowOverride: false,
    ProviderClass: Provider,
    ConsumerClass: Consumer,
  }
) => {
  const key = {};
  const provider = class Provider extends ProviderClass {
    key = key;
    allowOverride = allowOverride;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(host: UpdatingElement, value?: any) {
      super(host, value || initialValue);
    }
  };

  const consumer = class Consumer extends ConsumerClass {
    key = key;
  };

  return {provider, consumer};
};
