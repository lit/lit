/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Use this module if you want to create your own base class extending
 * {@link ReactiveElement}.
 * @packageDocumentation
 */

import {
  getCompatibleStyle,
  adoptStyles,
  CSSResultGroup,
  CSSResultOrNative,
} from './css-tag.js';
import type {
  ReactiveController,
  ReactiveControllerHost,
} from './reactive-controller.js';

// In the Node build, this import will be injected by Rollup:
// import {HTMLElement, customElements} from '@lit-labs/ssr-dom-shim';

export * from './css-tag.js';
export type {
  ReactiveController,
  ReactiveControllerHost,
} from './reactive-controller.js';

/**
 * Removes the `readonly` modifier from properties in the union K.
 *
 * This is a safer way to cast a value to a type with a mutable version of a
 * readonly field, than casting to an interface with the field re-declared
 * because it preserves the type of all the fields and warns on typos.
 */
type Mutable<T, K extends keyof T> = Omit<T, K> & {
  -readonly [P in keyof Pick<T, K>]: P extends K ? T[P] : never;
};

// TODO (justinfagnani): Add `hasOwn` here when we ship ES2022
const {
  is,
  defineProperty,
  getOwnPropertyDescriptor,
  getOwnPropertyNames,
  getOwnPropertySymbols,
  getPrototypeOf,
} = Object;

const NODE_MODE = false;

// Lets a minifier replace globalThis references with a minified name
const global = globalThis;

if (NODE_MODE) {
  global.customElements ??= customElements;
}

const DEV_MODE = true;

let issueWarning: (code: string, warning: string) => void;

const trustedTypes = (global as unknown as {trustedTypes?: {emptyScript: ''}})
  .trustedTypes;

// Temporary workaround for https://crbug.com/993268
// Currently, any attribute starting with "on" is considered to be a
// TrustedScript source. Such boolean attributes must be set to the equivalent
// trusted emptyScript value.
const emptyStringForBooleanAttribute = trustedTypes
  ? (trustedTypes.emptyScript as unknown as '')
  : '';

const polyfillSupport = DEV_MODE
  ? global.reactiveElementPolyfillSupportDevMode
  : global.reactiveElementPolyfillSupport;

if (DEV_MODE) {
  // Ensure warnings are issued only 1x, even if multiple versions of Lit
  // are loaded.
  const issuedWarnings: Set<string | undefined> = (global.litIssuedWarnings ??=
    new Set());

  // Issue a warning, if we haven't already.
  issueWarning = (code: string, warning: string) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!issuedWarnings.has(warning)) {
      console.warn(warning);
      issuedWarnings.add(warning);
    }
  };

  issueWarning(
    'dev-mode',
    `Lit is in dev mode. Not recommended for production!`
  );

  // Issue polyfill support warning.
  if (global.ShadyDOM?.inUse && polyfillSupport === undefined) {
    issueWarning(
      'polyfill-support-missing',
      `Shadow DOM is being polyfilled via \`ShadyDOM\` but ` +
        `the \`polyfill-support\` module has not been loaded.`
    );
  }
}

/**
 * Contains types that are part of the unstable debug API.
 *
 * Everything in this API is not stable and may change or be removed in the future,
 * even on patch releases.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ReactiveUnstable {
  /**
   * When Lit is running in dev mode and `window.emitLitDebugLogEvents` is true,
   * we will emit 'lit-debug' events to window, with live details about the update and render
   * lifecycle. These can be useful for writing debug tooling and visualizations.
   *
   * Please be aware that running with window.emitLitDebugLogEvents has performance overhead,
   * making certain operations that are normally very cheap (like a no-op render) much slower,
   * because we must copy data and dispatch events.
   */
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace DebugLog {
    export type Entry = Update;
    export interface Update {
      kind: 'update';
    }
  }
}

interface DebugLoggingWindow {
  // Even in dev mode, we generally don't want to emit these events, as that's
  // another level of cost, so only emit them when DEV_MODE is true _and_ when
  // window.emitLitDebugEvents is true.
  emitLitDebugLogEvents?: boolean;
}

/**
 * Useful for visualizing and logging insights into what the Lit template system is doing.
 *
 * Compiled out of prod mode builds.
 */
const debugLogEvent = DEV_MODE
  ? (event: ReactiveUnstable.DebugLog.Entry) => {
      const shouldEmit = (global as unknown as DebugLoggingWindow)
        .emitLitDebugLogEvents;
      if (!shouldEmit) {
        return;
      }
      global.dispatchEvent(
        new CustomEvent<ReactiveUnstable.DebugLog.Entry>('lit-debug', {
          detail: event,
        })
      );
    }
  : undefined;

/*
 * When using Closure Compiler, JSCompiler_renameProperty(property, object) is
 * replaced at compile time by the munged name for object[property]. We cannot
 * alias this function, so we have to use a small shim that has the same
 * behavior when not compiling.
 */
/*@__INLINE__*/
const JSCompiler_renameProperty = <P extends PropertyKey>(
  prop: P,
  _obj: unknown
): P => prop;

/**
 * Converts property values to and from attribute values.
 */
export interface ComplexAttributeConverter<Type = unknown, TypeHint = unknown> {
  /**
   * Called to convert an attribute value to a property
   * value.
   */
  fromAttribute?(value: string | null, type?: TypeHint): Type;

  /**
   * Called to convert a property value to an attribute
   * value.
   *
   * It returns unknown instead of string, to be compatible with
   * https://github.com/WICG/trusted-types (and similar efforts).
   */
  toAttribute?(value: Type, type?: TypeHint): unknown;
}

type AttributeConverter<Type = unknown, TypeHint = unknown> =
  | ComplexAttributeConverter<Type>
  | ((value: string | null, type?: TypeHint) => Type);

/**
 * Defines options for a property accessor.
 */
export interface PropertyDeclaration<Type = unknown, TypeHint = unknown> {
  /**
   * When set to `true`, indicates the property is internal private state. The
   * property should not be set by users. When using TypeScript, this property
   * should be marked as `private` or `protected`, and it is also a common
   * practice to use a leading `_` in the name. The property is not added to
   * `observedAttributes`.
   */
  readonly state?: boolean;

  /**
   * Indicates how and whether the property becomes an observed attribute.
   * If the value is `false`, the property is not added to `observedAttributes`.
   * If true or absent, the lowercased property name is observed (e.g. `fooBar`
   * becomes `foobar`). If a string, the string value is observed (e.g
   * `attribute: 'foo-bar'`).
   */
  readonly attribute?: boolean | string;

  /**
   * Indicates the type of the property. This is used only as a hint for the
   * `converter` to determine how to convert the attribute
   * to/from a property.
   */
  readonly type?: TypeHint;

  /**
   * Indicates how to convert the attribute to/from a property. If this value
   * is a function, it is used to convert the attribute value a the property
   * value. If it's an object, it can have keys for `fromAttribute` and
   * `toAttribute`. If no `toAttribute` function is provided and
   * `reflect` is set to `true`, the property value is set directly to the
   * attribute. A default `converter` is used if none is provided; it supports
   * `Boolean`, `String`, `Number`, `Object`, and `Array`. Note,
   * when a property changes and the converter is used to update the attribute,
   * the property is never updated again as a result of the attribute changing,
   * and vice versa.
   */
  readonly converter?: AttributeConverter<Type, TypeHint>;

  /**
   * Indicates if the property should reflect to an attribute.
   * If `true`, when the property is set, the attribute is set using the
   * attribute name determined according to the rules for the `attribute`
   * property option and the value of the property converted using the rules
   * from the `converter` property option.
   */
  readonly reflect?: boolean;

  /**
   * A function that indicates if a property should be considered changed when
   * it is set. The function should take the `newValue` and `oldValue` and
   * return `true` if an update should be requested.
   */
  hasChanged?(value: Type, oldValue: Type): boolean;

  /**
   * Indicates whether an accessor will be created for this property. By
   * default, an accessor will be generated for this property that requests an
   * update when set. If this flag is `true`, no accessor will be created, and
   * it will be the user's responsibility to call
   * `this.requestUpdate(propertyName, oldValue)` to request an update when
   * the property changes.
   */
  readonly noAccessor?: boolean;

  /**
   * Whether this property is wrapping accessors. This is set by `@property`
   * to control the initial value change and reflection logic.
   *
   * @internal
   */
  wrapped?: boolean;
}

/**
 * Map of properties to PropertyDeclaration options. For each property an
 * accessor is made, and the property is processed according to the
 * PropertyDeclaration options.
 */
export interface PropertyDeclarations {
  readonly [key: string]: PropertyDeclaration;
}

type PropertyDeclarationMap = Map<PropertyKey, PropertyDeclaration>;

type AttributeMap = Map<string, PropertyKey>;

/**
 * A Map of property keys to values.
 *
 * Takes an optional type parameter T, which when specified as a non-any,
 * non-unknown type, will make the Map more strongly-typed, associating the map
 * keys with their corresponding value type on T.
 *
 * Use `PropertyValues<this>` when overriding ReactiveElement.update() and
 * other lifecycle methods in order to get stronger type-checking on keys
 * and values.
 */
// This type is conditional so that if the parameter T is not specified, or
// is `any`, the type will include `Map<PropertyKey, unknown>`. Since T is not
// given in the uses of PropertyValues in this file, all uses here fallback to
// meaning `Map<PropertyKey, unknown>`, but if a developer uses
// `PropertyValues<this>` (or any other value for T) they will get a
// strongly-typed Map type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PropertyValues<T = any> = T extends object
  ? PropertyValueMap<T>
  : Map<PropertyKey, unknown>;

/**
 * Do not use, instead prefer {@linkcode PropertyValues}.
 */
// This type must be exported such that JavaScript generated by the Google
// Closure Compiler can import a type reference.
export interface PropertyValueMap<T> extends Map<PropertyKey, unknown> {
  get<K extends keyof T>(k: K): T[K] | undefined;
  set<K extends keyof T>(key: K, value: T[K]): this;
  has<K extends keyof T>(k: K): boolean;
  delete<K extends keyof T>(k: K): boolean;
}

export const defaultConverter: ComplexAttributeConverter = {
  toAttribute(value: unknown, type?: unknown): unknown {
    switch (type) {
      case Boolean:
        value = value ? emptyStringForBooleanAttribute : null;
        break;
      case Object:
      case Array:
        // if the value is `null` or `undefined` pass this through
        // to allow removing/no change behavior.
        value = value == null ? value : JSON.stringify(value);
        break;
    }
    return value;
  },

  fromAttribute(value: string | null, type?: unknown) {
    let fromValue: unknown = value;
    switch (type) {
      case Boolean:
        fromValue = value !== null;
        break;
      case Number:
        fromValue = value === null ? null : Number(value);
        break;
      case Object:
      case Array:
        // Do *not* generate exception when invalid JSON is set as elements
        // don't normally complain on being mis-configured.
        // TODO(sorvell): Do generate exception in *dev mode*.
        try {
          // Assert to adhere to Bazel's "must type assert JSON parse" rule.
          fromValue = JSON.parse(value!) as unknown;
        } catch (e) {
          fromValue = null;
        }
        break;
    }
    return fromValue;
  },
};

export interface HasChanged {
  (value: unknown, old: unknown): boolean;
}

/**
 * Change function that returns true if `value` is different from `oldValue`.
 * This method is used as the default for a property's `hasChanged` function.
 */
export const notEqual: HasChanged = (value: unknown, old: unknown): boolean =>
  !is(value, old);

const defaultPropertyDeclaration: PropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual,
};

/**
 * A string representing one of the supported dev mode warning categories.
 */
export type WarningKind =
  | 'change-in-update'
  | 'migration'
  | 'async-perform-update';

export type Initializer = (element: ReactiveElement) => void;

// Temporary, until google3 is on TypeScript 5.2
declare global {
  interface SymbolConstructor {
    readonly metadata: unique symbol;
  }
}

// Ensure metadata is enabled. TypeScript does not polyfill
// Symbol.metadata, so we must ensure that it exists.
(Symbol as {metadata: symbol}).metadata ??= Symbol('metadata');

declare global {
  // This is public global API, do not change!
  // eslint-disable-next-line no-var
  var litPropertyMetadata: WeakMap<
    object,
    Map<PropertyKey, PropertyDeclaration>
  >;
}

// Map from a class's metadata object to property options
// Note that we must use nullish-coalescing assignment so that we only use one
// map even if we load multiple version of this module.
global.litPropertyMetadata ??= new WeakMap<
  object,
  Map<PropertyKey, PropertyDeclaration>
>();

/**
 * Base element class which manages element properties and attributes. When
 * properties change, the `update` method is asynchronously called. This method
 * should be supplied by subclasses to render updates as desired.
 * @noInheritDoc
 */
export abstract class ReactiveElement
  // In the Node build, this `extends` clause will be substituted with
  // `(globalThis.HTMLElement ?? HTMLElement)`.
  //
  // This way, we will first prefer any global `HTMLElement` polyfill that the
  // user has assigned, and then fall back to the `HTMLElement` shim which has
  // been imported (see note at the top of this file about how this import is
  // generated by Rollup). Note that the `HTMLElement` variable has been
  // shadowed by this import, so it no longer refers to the global.
  extends HTMLElement
  implements ReactiveControllerHost
{
  // Note: these are patched in only in DEV_MODE.
  /**
   * Read or set all the enabled warning categories for this class.
   *
   * This property is only used in development builds.
   *
   * @nocollapse
   * @category dev-mode
   */
  static enabledWarnings?: WarningKind[];

  /**
   * Enable the given warning category for this class.
   *
   * This method only exists in development builds, so it should be accessed
   * with a guard like:
   *
   * ```ts
   * // Enable for all ReactiveElement subclasses
   * ReactiveElement.enableWarning?.('migration');
   *
   * // Enable for only MyElement and subclasses
   * MyElement.enableWarning?.('migration');
   * ```
   *
   * @nocollapse
   * @category dev-mode
   */
  static enableWarning?: (warningKind: WarningKind) => void;

  /**
   * Disable the given warning category for this class.
   *
   * This method only exists in development builds, so it should be accessed
   * with a guard like:
   *
   * ```ts
   * // Disable for all ReactiveElement subclasses
   * ReactiveElement.disableWarning?.('migration');
   *
   * // Disable for only MyElement and subclasses
   * MyElement.disableWarning?.('migration');
   * ```
   *
   * @nocollapse
   * @category dev-mode
   */
  static disableWarning?: (warningKind: WarningKind) => void;

  /**
   * Adds an initializer function to the class that is called during instance
   * construction.
   *
   * This is useful for code that runs against a `ReactiveElement`
   * subclass, such as a decorator, that needs to do work for each
   * instance, such as setting up a `ReactiveController`.
   *
   * ```ts
   * const myDecorator = (target: typeof ReactiveElement, key: string) => {
   *   target.addInitializer((instance: ReactiveElement) => {
   *     // This is run during construction of the element
   *     new MyController(instance);
   *   });
   * }
   * ```
   *
   * Decorating a field will then cause each instance to run an initializer
   * that adds a controller:
   *
   * ```ts
   * class MyElement extends LitElement {
   *   @myDecorator foo;
   * }
   * ```
   *
   * Initializers are stored per-constructor. Adding an initializer to a
   * subclass does not add it to a superclass. Since initializers are run in
   * constructors, initializers will run in order of the class hierarchy,
   * starting with superclasses and progressing to the instance's class.
   *
   * @nocollapse
   */
  static addInitializer(initializer: Initializer) {
    this.__prepare();
    (this._initializers ??= []).push(initializer);
  }

  static _initializers?: Initializer[];

  /*
   * Due to closure compiler ES6 compilation bugs, @nocollapse is required on
   * all static methods and properties with initializers.  Reference:
   * - https://github.com/google/closure-compiler/issues/1776
   */

  /**
   * Maps attribute names to properties; for example `foobar` attribute to
   * `fooBar` property. Created lazily on user subclasses when finalizing the
   * class.
   * @nocollapse
   */
  private static __attributeToPropertyMap: AttributeMap;

  /**
   * Marks class as having been finalized, which includes creating properties
   * from `static properties`, but does *not* include all properties created
   * from decorators.
   * @nocollapse
   */
  protected static finalized: true | undefined;

  /**
   * Memoized list of all element properties, including any superclass
   * properties. Created lazily on user subclasses when finalizing the class.
   *
   * @nocollapse
   * @category properties
   */
  static elementProperties: PropertyDeclarationMap;

  /**
   * User-supplied object that maps property names to `PropertyDeclaration`
   * objects containing options for configuring reactive properties. When
   * a reactive property is set the element will update and render.
   *
   * By default properties are public fields, and as such, they should be
   * considered as primarily settable by element users, either via attribute or
   * the property itself.
   *
   * Generally, properties that are changed by the element should be private or
   * protected fields and should use the `state: true` option. Properties
   * marked as `state` do not reflect from the corresponding attribute
   *
   * However, sometimes element code does need to set a public property. This
   * should typically only be done in response to user interaction, and an event
   * should be fired informing the user; for example, a checkbox sets its
   * `checked` property when clicked and fires a `changed` event. Mutating
   * public properties should typically not be done for non-primitive (object or
   * array) properties. In other cases when an element needs to manage state, a
   * private property set with the `state: true` option should be used. When
   * needed, state properties can be initialized via public properties to
   * facilitate complex interactions.
   * @nocollapse
   * @category properties
   */
  static properties: PropertyDeclarations;

  /**
   * Memoized list of all element styles.
   * Created lazily on user subclasses when finalizing the class.
   * @nocollapse
   * @category styles
   */
  static elementStyles: Array<CSSResultOrNative> = [];

  /**
   * Array of styles to apply to the element. The styles should be defined
   * using the {@linkcode css} tag function, via constructible stylesheets, or
   * imported from native CSS module scripts.
   *
   * Note on Content Security Policy:
   *
   * Element styles are implemented with `<style>` tags when the browser doesn't
   * support adopted StyleSheets. To use such `<style>` tags with the style-src
   * CSP directive, the style-src value must either include 'unsafe-inline' or
   * `nonce-<base64-value>` with `<base64-value>` replaced be a server-generated
   * nonce.
   *
   * To provide a nonce to use on generated `<style>` elements, set
   * `window.litNonce` to a server-generated nonce in your page's HTML, before
   * loading application code:
   *
   * ```html
   * <script>
   *   // Generated and unique per request:
   *   window.litNonce = 'a1b2c3d4';
   * </script>
   * ```
   * @nocollapse
   * @category styles
   */
  static styles?: CSSResultGroup;

  /**
   * Returns a list of attributes corresponding to the registered properties.
   * @nocollapse
   * @category attributes
   */
  static get observedAttributes() {
    // Ensure we've created all properties
    this.finalize();
    // this.__attributeToPropertyMap is only undefined after finalize() in
    // ReactiveElement itself. ReactiveElement.observedAttributes is only
    // accessed with ReactiveElement as the receiver when a subclass or mixin
    // calls super.observedAttributes
    return (
      this.__attributeToPropertyMap && [...this.__attributeToPropertyMap.keys()]
    );
  }

  private __instanceProperties?: PropertyValues = undefined;

  /**
   * Creates a property accessor on the element prototype if one does not exist
   * and stores a {@linkcode PropertyDeclaration} for the property with the
   * given options. The property setter calls the property's `hasChanged`
   * property option or uses a strict identity check to determine whether or not
   * to request an update.
   *
   * This method may be overridden to customize properties; however,
   * when doing so, it's important to call `super.createProperty` to ensure
   * the property is setup correctly. This method calls
   * `getPropertyDescriptor` internally to get a descriptor to install.
   * To customize what properties do when they are get or set, override
   * `getPropertyDescriptor`. To customize the options for a property,
   * implement `createProperty` like this:
   *
   * ```ts
   * static createProperty(name, options) {
   *   options = Object.assign(options, {myOption: true});
   *   super.createProperty(name, options);
   * }
   * ```
   *
   * @nocollapse
   * @category properties
   */
  static createProperty(
    name: PropertyKey,
    options: PropertyDeclaration = defaultPropertyDeclaration
  ) {
    // If this is a state property, force the attribute to false.
    if (options.state) {
      (options as Mutable<PropertyDeclaration, 'attribute'>).attribute = false;
    }
    this.__prepare();
    this.elementProperties.set(name, options);
    if (!options.noAccessor) {
      const key = DEV_MODE
        ? // Use Symbol.for in dev mode to make it easier to maintain state
          // when doing HMR.
          Symbol.for(`${String(name)} (@property() cache)`)
        : Symbol();
      const descriptor = this.getPropertyDescriptor(name, key, options);
      if (descriptor !== undefined) {
        defineProperty(this.prototype, name, descriptor);
      }
    }
  }

  /**
   * Returns a property descriptor to be defined on the given named property.
   * If no descriptor is returned, the property will not become an accessor.
   * For example,
   *
   * ```ts
   * class MyElement extends LitElement {
   *   static getPropertyDescriptor(name, key, options) {
   *     const defaultDescriptor =
   *         super.getPropertyDescriptor(name, key, options);
   *     const setter = defaultDescriptor.set;
   *     return {
   *       get: defaultDescriptor.get,
   *       set(value) {
   *         setter.call(this, value);
   *         // custom action.
   *       },
   *       configurable: true,
   *       enumerable: true
   *     }
   *   }
   * }
   * ```
   *
   * @nocollapse
   * @category properties
   */
  protected static getPropertyDescriptor(
    name: PropertyKey,
    key: string | symbol,
    options: PropertyDeclaration
  ): PropertyDescriptor | undefined {
    const {get, set} = getOwnPropertyDescriptor(this.prototype, name) ?? {
      get(this: ReactiveElement) {
        return this[key as keyof typeof this];
      },
      set(this: ReactiveElement, v: unknown) {
        (this as unknown as Record<string | symbol, unknown>)[key] = v;
      },
    };
    if (DEV_MODE && get == null) {
      if ('value' in (getOwnPropertyDescriptor(this.prototype, name) ?? {})) {
        throw new Error(
          `Field ${JSON.stringify(String(name))} on ` +
            `${this.name} was declared as a reactive property ` +
            `but it's actually declared as a value on the prototype. ` +
            `Usually this is due to using @property or @state on a method.`
        );
      }
      issueWarning(
        'reactive-property-without-getter',
        `Field ${JSON.stringify(String(name))} on ` +
          `${this.name} was declared as a reactive property ` +
          `but it does not have a getter. This will be an error in a ` +
          `future version of Lit.`
      );
    }
    return {
      get(this: ReactiveElement) {
        return get?.call(this);
      },
      set(this: ReactiveElement, value: unknown) {
        const oldValue = get?.call(this);
        set!.call(this, value);
        this.requestUpdate(name, oldValue, options);
      },
      configurable: true,
      enumerable: true,
    };
  }

  /**
   * Returns the property options associated with the given property.
   * These options are defined with a `PropertyDeclaration` via the `properties`
   * object or the `@property` decorator and are registered in
   * `createProperty(...)`.
   *
   * Note, this method should be considered "final" and not overridden. To
   * customize the options for a given property, override
   * {@linkcode createProperty}.
   *
   * @nocollapse
   * @final
   * @category properties
   */
  static getPropertyOptions(name: PropertyKey) {
    return this.elementProperties.get(name) ?? defaultPropertyDeclaration;
  }

  // Temporary, until google3 is on TypeScript 5.2
  declare static [Symbol.metadata]: object & Record<PropertyKey, unknown>;

  /**
   * Initializes static own properties of the class used in bookkeeping
   * for element properties, initializers, etc.
   *
   * Can be called multiple times by code that needs to ensure these
   * properties exist before using them.
   *
   * This method ensures the superclass is finalized so that inherited
   * property metadata can be copied down.
   * @nocollapse
   */
  private static __prepare() {
    if (
      this.hasOwnProperty(JSCompiler_renameProperty('elementProperties', this))
    ) {
      // Already prepared
      return;
    }
    // Finalize any superclasses
    const superCtor = getPrototypeOf(this) as typeof ReactiveElement;
    superCtor.finalize();

    // Create own set of initializers for this class if any exist on the
    // superclass and copy them down. Note, for a small perf boost, avoid
    // creating initializers unless needed.
    if (superCtor._initializers !== undefined) {
      this._initializers = [...superCtor._initializers];
    }
    // Initialize elementProperties from the superclass
    this.elementProperties = new Map(superCtor.elementProperties);
  }

  /**
   * Finishes setting up the class so that it's ready to be registered
   * as a custom element and instantiated.
   *
   * This method is called by the ReactiveElement.observedAttributes getter.
   * If you override the observedAttributes getter, you must either call
   * super.observedAttributes to trigger finalization, or call finalize()
   * yourself.
   *
   * @nocollapse
   */
  protected static finalize() {
    if (this.hasOwnProperty(JSCompiler_renameProperty('finalized', this))) {
      return;
    }
    this.finalized = true;
    this.__prepare();

    // Create properties from the static properties block:
    if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
      const props = this.properties;
      const propKeys = [
        ...getOwnPropertyNames(props),
        ...getOwnPropertySymbols(props),
      ] as Array<keyof typeof props>;
      for (const p of propKeys) {
        this.createProperty(p, props[p]);
      }
    }

    // Create properties from standard decorator metadata:
    const metadata = this[Symbol.metadata];
    if (metadata !== null) {
      const properties = litPropertyMetadata.get(metadata);
      if (properties !== undefined) {
        for (const [p, options] of properties) {
          this.elementProperties.set(p, options);
        }
      }
    }

    // Create the attribute-to-property map
    this.__attributeToPropertyMap = new Map();
    for (const [p, options] of this.elementProperties) {
      const attr = this.__attributeNameForProperty(p, options);
      if (attr !== undefined) {
        this.__attributeToPropertyMap.set(attr, p);
      }
    }

    this.elementStyles = this.finalizeStyles(this.styles);

    if (DEV_MODE) {
      if (this.hasOwnProperty('createProperty')) {
        issueWarning(
          'no-override-create-property',
          'Overriding ReactiveElement.createProperty() is deprecated. ' +
            'The override will not be called with standard decorators'
        );
      }
      if (this.hasOwnProperty('getPropertyDescriptor')) {
        issueWarning(
          'no-override-get-property-descriptor',
          'Overriding ReactiveElement.getPropertyDescriptor() is deprecated. ' +
            'The override will not be called with standard decorators'
        );
      }
    }
  }

  /**
   * Options used when calling `attachShadow`. Set this property to customize
   * the options for the shadowRoot; for example, to create a closed
   * shadowRoot: `{mode: 'closed'}`.
   *
   * Note, these options are used in `createRenderRoot`. If this method
   * is customized, options should be respected if possible.
   * @nocollapse
   * @category rendering
   */
  static shadowRootOptions: ShadowRootInit = {mode: 'open'};

  /**
   * Takes the styles the user supplied via the `static styles` property and
   * returns the array of styles to apply to the element.
   * Override this method to integrate into a style management system.
   *
   * Styles are deduplicated preserving the _last_ instance in the list. This
   * is a performance optimization to avoid duplicated styles that can occur
   * especially when composing via subclassing. The last item is kept to try
   * to preserve the cascade order with the assumption that it's most important
   * that last added styles override previous styles.
   *
   * @nocollapse
   * @category styles
   */
  protected static finalizeStyles(
    styles?: CSSResultGroup
  ): Array<CSSResultOrNative> {
    const elementStyles = [];
    if (Array.isArray(styles)) {
      // Dedupe the flattened array in reverse order to preserve the last items.
      // Casting to Array<unknown> works around TS error that
      // appears to come from trying to flatten a type CSSResultArray.
      const set = new Set((styles as Array<unknown>).flat(Infinity).reverse());
      // Then preserve original order by adding the set items in reverse order.
      for (const s of set) {
        elementStyles.unshift(getCompatibleStyle(s as CSSResultOrNative));
      }
    } else if (styles !== undefined) {
      elementStyles.push(getCompatibleStyle(styles));
    }
    return elementStyles;
  }

  /**
   * Node or ShadowRoot into which element DOM should be rendered. Defaults
   * to an open shadowRoot.
   * @category rendering
   */
  readonly renderRoot!: HTMLElement | DocumentFragment;

  /**
   * Returns the property name for the given attribute `name`.
   * @nocollapse
   */
  private static __attributeNameForProperty(
    name: PropertyKey,
    options: PropertyDeclaration
  ) {
    const attribute = options.attribute;
    return attribute === false
      ? undefined
      : typeof attribute === 'string'
      ? attribute
      : typeof name === 'string'
      ? name.toLowerCase()
      : undefined;
  }

  // Initialize to an unresolved Promise so we can make sure the element has
  // connected before first update.
  private __updatePromise!: Promise<boolean>;

  /**
   * True if there is a pending update as a result of calling `requestUpdate()`.
   * Should only be read.
   * @category updates
   */
  isUpdatePending = false;

  /**
   * Is set to `true` after the first update. The element code cannot assume
   * that `renderRoot` exists before the element `hasUpdated`.
   * @category updates
   */
  hasUpdated = false;

  /**
   * Map with keys for any properties that have changed since the last
   * update cycle with previous values.
   *
   * @internal
   */
  _$changedProperties!: PropertyValues;

  /**
   * Properties that should be reflected when updated.
   */
  private __reflectingProperties?: Set<PropertyKey>;

  /**
   * Name of currently reflecting property
   */
  private __reflectingProperty: PropertyKey | null = null;

  /**
   * Set of controllers.
   */
  private __controllers?: ReactiveController[];

  constructor() {
    super();
    this.__initialize();
  }

  /**
   * Internal only override point for customizing work done when elements
   * are constructed.
   */
  private __initialize() {
    this.__updatePromise = new Promise<boolean>(
      (res) => (this.enableUpdating = res)
    );
    this._$changedProperties = new Map();
    // This enqueues a microtask that ust run before the first update, so it
    // must be called before requestUpdate()
    this.__saveInstanceProperties();
    // ensures first update will be caught by an early access of
    // `updateComplete`
    this.requestUpdate();
    (this.constructor as typeof ReactiveElement)._initializers?.forEach((i) =>
      i(this)
    );
  }

  /**
   * Registers a `ReactiveController` to participate in the element's reactive
   * update cycle. The element automatically calls into any registered
   * controllers during its lifecycle callbacks.
   *
   * If the element is connected when `addController()` is called, the
   * controller's `hostConnected()` callback will be immediately called.
   * @category controllers
   */
  addController(controller: ReactiveController) {
    (this.__controllers ??= []).push(controller);
    // If a controller is added after the element has been connected,
    // call hostConnected. Note, re-using existence of `renderRoot` here
    // (which is set in connectedCallback) to avoid the need to track a
    // first connected state.
    if (this.renderRoot !== undefined && this.isConnected) {
      controller.hostConnected?.();
    }
  }

  /**
   * Removes a `ReactiveController` from the element.
   * @category controllers
   */
  removeController(controller: ReactiveController) {
    // Note, if the indexOf is -1, the >>> will flip the sign which makes the
    // splice do nothing.
    this.__controllers?.splice(this.__controllers.indexOf(controller) >>> 0, 1);
  }

  /**
   * Fixes any properties set on the instance before upgrade time.
   * Otherwise these would shadow the accessor and break these properties.
   * The properties are stored in a Map which is played back after the
   * constructor runs. Note, on very old versions of Safari (<=9) or Chrome
   * (<=41), properties created for native platform properties like (`id` or
   * `name`) may not have default values set in the element constructor. On
   * these browsers native properties appear on instances and therefore their
   * default value will overwrite any element default (e.g. if the element sets
   * this.id = 'id' in the constructor, the 'id' will become '' since this is
   * the native platform default).
   */
  private __saveInstanceProperties() {
    const instanceProperties = new Map<PropertyKey, unknown>();
    const elementProperties = (this.constructor as typeof ReactiveElement)
      .elementProperties;
    for (const p of elementProperties.keys() as IterableIterator<keyof this>) {
      if (this.hasOwnProperty(p)) {
        instanceProperties.set(p, this[p]);
        delete this[p];
      }
    }
    if (instanceProperties.size > 0) {
      this.__instanceProperties = instanceProperties;
    }
  }

  /**
   * Returns the node into which the element should render and by default
   * creates and returns an open shadowRoot. Implement to customize where the
   * element's DOM is rendered. For example, to render into the element's
   * childNodes, return `this`.
   *
   * @return Returns a node into which to render.
   * @category rendering
   */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const renderRoot =
      this.shadowRoot ??
      this.attachShadow(
        (this.constructor as typeof ReactiveElement).shadowRootOptions
      );
    adoptStyles(
      renderRoot,
      (this.constructor as typeof ReactiveElement).elementStyles
    );
    return renderRoot;
  }

  /**
   * On first connection, creates the element's renderRoot, sets up
   * element styling, and enables updating.
   * @category lifecycle
   */
  connectedCallback() {
    // Create renderRoot before first update.
    (this as Mutable<typeof this, 'renderRoot'>).renderRoot ??=
      this.createRenderRoot();
    this.enableUpdating(true);
    this.__controllers?.forEach((c) => c.hostConnected?.());
  }

  /**
   * Note, this method should be considered final and not overridden. It is
   * overridden on the element instance with a function that triggers the first
   * update.
   * @category updates
   */
  protected enableUpdating(_requestedUpdate: boolean) {}

  /**
   * Allows for `super.disconnectedCallback()` in extensions while
   * reserving the possibility of making non-breaking feature additions
   * when disconnecting at some point in the future.
   * @category lifecycle
   */
  disconnectedCallback() {
    this.__controllers?.forEach((c) => c.hostDisconnected?.());
  }

  /**
   * Synchronizes property values when attributes change.
   *
   * Specifically, when an attribute is set, the corresponding property is set.
   * You should rarely need to implement this callback. If this method is
   * overridden, `super.attributeChangedCallback(name, _old, value)` must be
   * called.
   *
   * See [using the lifecycle callbacks](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks)
   * on MDN for more information about the `attributeChangedCallback`.
   * @category attributes
   */
  attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null
  ) {
    this._$attributeToProperty(name, value);
  }

  private __propertyToAttribute(name: PropertyKey, value: unknown) {
    const elemProperties: PropertyDeclarationMap = (
      this.constructor as typeof ReactiveElement
    ).elementProperties;
    const options = elemProperties.get(name)!;
    const attr = (
      this.constructor as typeof ReactiveElement
    ).__attributeNameForProperty(name, options);
    if (attr !== undefined && options.reflect === true) {
      const converter =
        (options.converter as ComplexAttributeConverter)?.toAttribute !==
        undefined
          ? (options.converter as ComplexAttributeConverter)
          : defaultConverter;
      const attrValue = converter.toAttribute!(value, options.type);
      if (
        DEV_MODE &&
        (this.constructor as typeof ReactiveElement).enabledWarnings!.includes(
          'migration'
        ) &&
        attrValue === undefined
      ) {
        issueWarning(
          'undefined-attribute-value',
          `The attribute value for the ${name as string} property is ` +
            `undefined on element ${this.localName}. The attribute will be ` +
            `removed, but in the previous version of \`ReactiveElement\`, ` +
            `the attribute would not have changed.`
        );
      }
      // Track if the property is being reflected to avoid
      // setting the property again via `attributeChangedCallback`. Note:
      // 1. this takes advantage of the fact that the callback is synchronous.
      // 2. will behave incorrectly if multiple attributes are in the reaction
      // stack at time of calling. However, since we process attributes
      // in `update` this should not be possible (or an extreme corner case
      // that we'd like to discover).
      // mark state reflecting
      this.__reflectingProperty = name;
      if (attrValue == null) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, attrValue as string);
      }
      // mark state not reflecting
      this.__reflectingProperty = null;
    }
  }

  /** @internal */
  _$attributeToProperty(name: string, value: string | null) {
    const ctor = this.constructor as typeof ReactiveElement;
    // Note, hint this as an `AttributeMap` so closure clearly understands
    // the type; it has issues with tracking types through statics
    const propName = (ctor.__attributeToPropertyMap as AttributeMap).get(name);
    // Use tracking info to avoid reflecting a property value to an attribute
    // if it was just set because the attribute changed.
    if (propName !== undefined && this.__reflectingProperty !== propName) {
      const options = ctor.getPropertyOptions(propName);
      const converter =
        typeof options.converter === 'function'
          ? {fromAttribute: options.converter}
          : options.converter?.fromAttribute !== undefined
          ? options.converter
          : defaultConverter;
      // mark state reflecting
      this.__reflectingProperty = propName;
      this[propName as keyof this] = converter.fromAttribute!(
        value,
        options.type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;
      // mark state not reflecting
      this.__reflectingProperty = null;
    }
  }

  /**
   * Requests an update which is processed asynchronously. This should be called
   * when an element should update based on some state not triggered by setting
   * a reactive property. In this case, pass no arguments. It should also be
   * called when manually implementing a property setter. In this case, pass the
   * property `name` and `oldValue` to ensure that any configured property
   * options are honored.
   *
   * @param name name of requesting property
   * @param oldValue old value of requesting property
   * @param options property options to use instead of the previously
   *     configured options
   * @param initial whether this call is for the initial value of the property.
   *     Initial values do not reflect to an attribute.
   * @category updates
   */
  requestUpdate(
    name?: PropertyKey,
    oldValue?: unknown,
    options?: PropertyDeclaration
  ): void;
  /* @internal */
  requestUpdate(
    name?: PropertyKey,
    oldValue?: unknown,
    options?: PropertyDeclaration,
    initial = false,
    initialValue?: unknown
  ): void {
    // If we have a property key, perform property update steps.
    if (name !== undefined) {
      options ??= (
        this.constructor as typeof ReactiveElement
      ).getPropertyOptions(name);
      const hasChanged = options.hasChanged ?? notEqual;
      const newValue = initial ? initialValue : this[name as keyof this];
      if (hasChanged(newValue, oldValue)) {
        this._$changeProperty(name, oldValue, options);
      } else {
        // Abort the request if the property should not be considered changed.
        return;
      }
    }
    if (this.isUpdatePending === false) {
      this.__updatePromise = this.__enqueueUpdate();
    }
  }

  /**
   * @internal
   */
  _$changeProperty(
    name: PropertyKey,
    oldValue: unknown,
    options: PropertyDeclaration
  ) {
    // TODO (justinfagnani): Create a benchmark of Map.has() + Map.set(
    // vs just Map.set()
    if (!this._$changedProperties.has(name)) {
      this._$changedProperties.set(name, oldValue);
    }
    // Add to reflecting properties set.
    // Note, it's important that every change has a chance to add the
    // property to `__reflectingProperties`. This ensures setting
    // attribute + property reflects correctly.
    if (options.reflect === true && this.__reflectingProperty !== name) {
      (this.__reflectingProperties ??= new Set<PropertyKey>()).add(name);
    }
  }

  /**
   * Sets up the element to asynchronously update.
   */
  private async __enqueueUpdate() {
    this.isUpdatePending = true;
    try {
      // Ensure any previous update has resolved before updating.
      // This `await` also ensures that property changes are batched.
      await this.__updatePromise;
    } catch (e) {
      // Refire any previous errors async so they do not disrupt the update
      // cycle. Errors are refired so developers have a chance to observe
      // them, and this can be done by implementing
      // `window.onunhandledrejection`.
      Promise.reject(e);
    }
    const result = this.scheduleUpdate();
    // If `scheduleUpdate` returns a Promise, we await it. This is done to
    // enable coordinating updates with a scheduler. Note, the result is
    // checked to avoid delaying an additional microtask unless we need to.
    if (result != null) {
      await result;
    }
    return !this.isUpdatePending;
  }

  /**
   * Schedules an element update. You can override this method to change the
   * timing of updates by returning a Promise. The update will await the
   * returned Promise, and you should resolve the Promise to allow the update
   * to proceed. If this method is overridden, `super.scheduleUpdate()`
   * must be called.
   *
   * For instance, to schedule updates to occur just before the next frame:
   *
   * ```ts
   * override protected async scheduleUpdate(): Promise<unknown> {
   *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
   *   super.scheduleUpdate();
   * }
   * ```
   * @category updates
   */
  protected scheduleUpdate(): void | Promise<unknown> {
    const result = this.performUpdate();
    if (
      DEV_MODE &&
      (this.constructor as typeof ReactiveElement).enabledWarnings!.includes(
        'async-perform-update'
      ) &&
      typeof (result as unknown as Promise<unknown> | undefined)?.then ===
        'function'
    ) {
      issueWarning(
        'async-perform-update',
        `Element ${this.localName} returned a Promise from performUpdate(). ` +
          `This behavior is deprecated and will be removed in a future ` +
          `version of ReactiveElement.`
      );
    }
    return result;
  }

  /**
   * Performs an element update. Note, if an exception is thrown during the
   * update, `firstUpdated` and `updated` will not be called.
   *
   * Call `performUpdate()` to immediately process a pending update. This should
   * generally not be needed, but it can be done in rare cases when you need to
   * update synchronously.
   *
   * @category updates
   */
  protected performUpdate(): void {
    // Abort any update if one is not pending when this is called.
    // This can happen if `performUpdate` is called early to "flush"
    // the update.
    if (!this.isUpdatePending) {
      return;
    }
    debugLogEvent?.({kind: 'update'});
    if (!this.hasUpdated) {
      if (DEV_MODE) {
        // Produce warning if any reactive properties on the prototype are
        // shadowed by class fields. Instance fields set before upgrade are
        // deleted by this point, so any own property is caused by class field
        // initialization in the constructor.
        const ctor = this.constructor as typeof ReactiveElement;
        const shadowedProperties = [...ctor.elementProperties.keys()].filter(
          (p) => this.hasOwnProperty(p) && p in getPrototypeOf(this)
        );
        if (shadowedProperties.length) {
          throw new Error(
            `The following properties on element ${this.localName} will not ` +
              `trigger updates as expected because they are set using class ` +
              `fields: ${shadowedProperties.join(', ')}. ` +
              `Native class fields and some compiled output will overwrite ` +
              `accessors used for detecting changes. See ` +
              `https://lit.dev/msg/class-field-shadowing ` +
              `for more information.`
          );
        }
      }
      // Mixin instance properties once, if they exist.
      if (this.__instanceProperties) {
        // TODO (justinfagnani): should we use the stored value? Could a new value
        // have been set since we stored the own property value?
        for (const [p, value] of this.__instanceProperties) {
          this[p as keyof this] = value as this[keyof this];
        }
        this.__instanceProperties = undefined;
      }
      // Trigger initial value reflection and populate the initial
      // changedProperties map, but only for the case of experimental
      // decorators on accessors, which will not have already populated the
      // changedProperties map. We can't know if these accessors had
      // initializers, so we just set them anyway - a difference from
      // experimental decorators on fields and standard decorators on
      // auto-accessors.
      // For context why experimentalDecorators with auto accessors are handled
      // specifically also see:
      // https://github.com/lit/lit/pull/4183#issuecomment-1711959635
      const elementProperties = (this.constructor as typeof ReactiveElement)
        .elementProperties;
      if (elementProperties.size > 0) {
        for (const [p, options] of elementProperties) {
          if (
            options.wrapped === true &&
            !this._$changedProperties.has(p) &&
            this[p as keyof this] !== undefined
          ) {
            this._$changeProperty(p, this[p as keyof this], options);
          }
        }
      }
    }
    let shouldUpdate = false;
    const changedProperties = this._$changedProperties;
    try {
      shouldUpdate = this.shouldUpdate(changedProperties);
      if (shouldUpdate) {
        this.willUpdate(changedProperties);
        this.__controllers?.forEach((c) => c.hostUpdate?.());
        this.update(changedProperties);
      } else {
        this.__markUpdated();
      }
    } catch (e) {
      // Prevent `firstUpdated` and `updated` from running when there's an
      // update exception.
      shouldUpdate = false;
      // Ensure element can accept additional updates after an exception.
      this.__markUpdated();
      throw e;
    }
    // The update is no longer considered pending and further updates are now allowed.
    if (shouldUpdate) {
      this._$didUpdate(changedProperties);
    }
  }

  /**
   * Invoked before `update()` to compute values needed during the update.
   *
   * Implement `willUpdate` to compute property values that depend on other
   * properties and are used in the rest of the update process.
   *
   * ```ts
   * willUpdate(changedProperties) {
   *   // only need to check changed properties for an expensive computation.
   *   if (changedProperties.has('firstName') || changedProperties.has('lastName')) {
   *     this.sha = computeSHA(`${this.firstName} ${this.lastName}`);
   *   }
   * }
   *
   * render() {
   *   return html`SHA: ${this.sha}`;
   * }
   * ```
   *
   * @category updates
   */
  protected willUpdate(_changedProperties: PropertyValues): void {}

  // Note, this is an override point for polyfill-support.
  // @internal
  _$didUpdate(changedProperties: PropertyValues) {
    this.__controllers?.forEach((c) => c.hostUpdated?.());
    if (!this.hasUpdated) {
      this.hasUpdated = true;
      this.firstUpdated(changedProperties);
    }
    this.updated(changedProperties);
    if (
      DEV_MODE &&
      this.isUpdatePending &&
      (this.constructor as typeof ReactiveElement).enabledWarnings!.includes(
        'change-in-update'
      )
    ) {
      issueWarning(
        'change-in-update',
        `Element ${this.localName} scheduled an update ` +
          `(generally because a property was set) ` +
          `after an update completed, causing a new update to be scheduled. ` +
          `This is inefficient and should be avoided unless the next update ` +
          `can only be scheduled as a side effect of the previous update.`
      );
    }
  }

  private __markUpdated() {
    this._$changedProperties = new Map();
    this.isUpdatePending = false;
  }

  /**
   * Returns a Promise that resolves when the element has completed updating.
   * The Promise value is a boolean that is `true` if the element completed the
   * update without triggering another update. The Promise result is `false` if
   * a property was set inside `updated()`. If the Promise is rejected, an
   * exception was thrown during the update.
   *
   * To await additional asynchronous work, override the `getUpdateComplete`
   * method. For example, it is sometimes useful to await a rendered element
   * before fulfilling this Promise. To do this, first await
   * `super.getUpdateComplete()`, then any subsequent state.
   *
   * @return A promise of a boolean that resolves to true if the update completed
   *     without triggering another update.
   * @category updates
   */
  get updateComplete(): Promise<boolean> {
    return this.getUpdateComplete();
  }

  /**
   * Override point for the `updateComplete` promise.
   *
   * It is not safe to override the `updateComplete` getter directly due to a
   * limitation in TypeScript which means it is not possible to call a
   * superclass getter (e.g. `super.updateComplete.then(...)`) when the target
   * language is ES5 (https://github.com/microsoft/TypeScript/issues/338).
   * This method should be overridden instead. For example:
   *
   * ```ts
   * class MyElement extends LitElement {
   *   override async getUpdateComplete() {
   *     const result = await super.getUpdateComplete();
   *     await this._myChild.updateComplete;
   *     return result;
   *   }
   * }
   * ```
   *
   * @return A promise of a boolean that resolves to true if the update completed
   *     without triggering another update.
   * @category updates
   */
  protected getUpdateComplete(): Promise<boolean> {
    return this.__updatePromise;
  }

  /**
   * Controls whether or not `update()` should be called when the element requests
   * an update. By default, this method always returns `true`, but this can be
   * customized to control when to update.
   *
   * @param _changedProperties Map of changed properties with old values
   * @category updates
   */
  protected shouldUpdate(_changedProperties: PropertyValues): boolean {
    return true;
  }

  /**
   * Updates the element. This method reflects property values to attributes.
   * It can be overridden to render and keep updated element DOM.
   * Setting properties inside this method will *not* trigger
   * another update.
   *
   * @param _changedProperties Map of changed properties with old values
   * @category updates
   */
  protected update(_changedProperties: PropertyValues) {
    // The forEach() expression will only run when when __reflectingProperties is
    // defined, and it returns undefined, setting __reflectingProperties to
    // undefined
    this.__reflectingProperties &&= this.__reflectingProperties.forEach((p) =>
      this.__propertyToAttribute(p, this[p as keyof this])
    ) as undefined;
    this.__markUpdated();
  }

  /**
   * Invoked whenever the element is updated. Implement to perform
   * post-updating tasks via DOM APIs, for example, focusing an element.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   * @category updates
   */
  protected updated(_changedProperties: PropertyValues) {}

  /**
   * Invoked when the element is first updated. Implement to perform one time
   * work on the element after update.
   *
   * ```ts
   * firstUpdated() {
   *   this.renderRoot.getElementById('my-text-area').focus();
   * }
   * ```
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   * @category updates
   */
  protected firstUpdated(_changedProperties: PropertyValues) {}
}
// Assigned here to work around a jscompiler bug with static fields
// when compiling to ES5.
// https://github.com/google/closure-compiler/issues/3177
(ReactiveElement as unknown as Record<string, unknown>)[
  JSCompiler_renameProperty('elementProperties', ReactiveElement)
] = new Map();
(ReactiveElement as unknown as Record<string, unknown>)[
  JSCompiler_renameProperty('finalized', ReactiveElement)
] = new Map();

// Apply polyfills if available
polyfillSupport?.({ReactiveElement});

// Dev mode warnings...
if (DEV_MODE) {
  // Default warning set.
  ReactiveElement.enabledWarnings = [
    'change-in-update',
    'async-perform-update',
  ];
  const ensureOwnWarnings = function (ctor: typeof ReactiveElement) {
    if (
      !ctor.hasOwnProperty(JSCompiler_renameProperty('enabledWarnings', ctor))
    ) {
      ctor.enabledWarnings = ctor.enabledWarnings!.slice();
    }
  };
  ReactiveElement.enableWarning = function (
    this: typeof ReactiveElement,
    warning: WarningKind
  ) {
    ensureOwnWarnings(this);
    if (!this.enabledWarnings!.includes(warning)) {
      this.enabledWarnings!.push(warning);
    }
  };
  ReactiveElement.disableWarning = function (
    this: typeof ReactiveElement,
    warning: WarningKind
  ) {
    ensureOwnWarnings(this);
    const i = this.enabledWarnings!.indexOf(warning);
    if (i >= 0) {
      this.enabledWarnings!.splice(i, 1);
    }
  };
}

// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for ReactiveElement usage.
(global.reactiveElementVersions ??= []).push('2.0.1');
if (DEV_MODE && global.reactiveElementVersions.length > 1) {
  issueWarning!(
    'multiple-versions',
    `Multiple versions of Lit loaded. Loading multiple versions ` +
      `is not recommended.`
  );
}
