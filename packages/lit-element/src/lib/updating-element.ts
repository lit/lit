/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
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

/**
 * Use this module if you want to create your own base class extending
 * [[UpdatingElement]].
 * @packageDocumentation
 */

/*
 * When using Closure Compiler, JSCompiler_renameProperty(property, object) is
 * replaced at compile time by the munged name for object[property]. We cannot
 * alias this function, so we have to use a small shim that has the same
 * behavior when not compiling.
 */
window.JSCompiler_renameProperty =
    <P extends PropertyKey>(prop: P, _obj: unknown): P => prop;

declare global {
  var JSCompiler_renameProperty: <P extends PropertyKey>(
      prop: P, _obj: unknown) => P;

  interface Window {
    JSCompiler_renameProperty: typeof JSCompiler_renameProperty;
  }
}

/**
 * Converts property values to and from attribute values.
 */
export interface ComplexAttributeConverter<Type = unknown, TypeHint = unknown> {
  /**
   * Function called to convert an attribute value to a property
   * value.
   */
  fromAttribute?(value: string|null, type?: TypeHint): Type;

  /**
   * Function called to convert a property value to an attribute
   * value.
   *
   * It returns unknown instead of string, to be compatible with
   * https://github.com/WICG/trusted-types (and similar efforts).
   */
  toAttribute?(value: Type, type?: TypeHint): unknown;
}

type AttributeConverter<Type = unknown, TypeHint = unknown> =
    ComplexAttributeConverter<Type>|
    ((value: string|null, type?: TypeHint) => Type);

/**
 * Defines options for a property accessor.
 */
export interface PropertyDeclaration<Type = unknown, TypeHint = unknown> {
  /**
   * Indicates how and whether the property becomes an observed attribute.
   * If the value is `false`, the property is not added to `observedAttributes`.
   * If true or absent, the lowercased property name is observed (e.g. `fooBar`
   * becomes `foobar`). If a string, the string value is observed (e.g
   * `attribute: 'foo-bar'`).
   */
  readonly attribute?: boolean|string;

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
 * Map of changed properties with old values. Takes an optional generic
 * interface corresponding to the declared element properties.
 */
// tslint:disable-next-line:no-any
export type PropertyValues<T = any> =
    keyof T extends PropertyKey ? Map<keyof T, unknown>: never;

export const defaultConverter: ComplexAttributeConverter = {

  toAttribute(value: unknown, type?: unknown): unknown {
    switch (type) {
      case Boolean:
        return value ? '' : null;
      case Object:
      case Array:
        // if the value is `null` or `undefined` pass this through
        // to allow removing/no change behavior.
        return value == null ? value : JSON.stringify(value);
    }
    return value;
  },

  fromAttribute(value: string|null, type?: unknown) {
    switch (type) {
      case Boolean:
        return value !== null;
      case Number:
        return value === null ? null : Number(value);
      case Object:
      case Array:
        return JSON.parse(value!);
    }
    return value;
  }

};

export interface HasChanged {
  (value: unknown, old: unknown): boolean;
}

/**
 * Change function that returns true if `value` is different from `oldValue`.
 * This method is used as the default for a property's `hasChanged` function.
 */
export const notEqual: HasChanged = (value: unknown, old: unknown): boolean => {
  // This ensures (old==NaN, value==NaN) always returns false
  return old !== value && (old === old || value === value);
};

const defaultPropertyDeclaration: PropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual
};

const STATE_HAS_UPDATED = 1;
const STATE_UPDATE_REQUESTED = 1 << 2;
const STATE_IS_REFLECTING_TO_ATTRIBUTE = 1 << 3;
const STATE_IS_REFLECTING_TO_PROPERTY = 1 << 4;
type UpdateState = typeof STATE_HAS_UPDATED|typeof STATE_UPDATE_REQUESTED|
    typeof STATE_IS_REFLECTING_TO_ATTRIBUTE|
    typeof STATE_IS_REFLECTING_TO_PROPERTY;

/**
 * The Closure JS Compiler doesn't currently have good support for static
 * property semantics where "this" is dynamic (e.g.
 * https://github.com/google/closure-compiler/issues/3177 and others) so we use
 * this hack to bypass any rewriting by the compiler.
 */
const finalized = 'finalized';

/**
 * Base element class which manages element properties and attributes. When
 * properties change, the `update` method is asynchronously called. This method
 * should be supplied by subclassers to render updates as desired.
 * @noInheritDoc
 */
export abstract class UpdatingElement extends HTMLElement {
  /*
   * Due to closure compiler ES6 compilation bugs, @nocollapse is required on
   * all static methods and properties with initializers.  Reference:
   * - https://github.com/google/closure-compiler/issues/1776
   */

  /**
   * Maps attribute names to properties; for example `foobar` attribute to
   * `fooBar` property. Created lazily on user subclasses when finalizing the
   * class.
   */
  private static _attributeToPropertyMap: AttributeMap;

  /**
   * Marks class as having finished creating properties.
   */
  protected static[finalized] = true;

  /**
   * Memoized list of all class properties, including any superclass properties.
   * Created lazily on user subclasses when finalizing the class.
   */
  private static _classProperties?: PropertyDeclarationMap;

  /**
   * User-supplied object that maps property names to `PropertyDeclaration`
   * objects containing options for configuring the property.
   */
  static properties: PropertyDeclarations;

  /**
   * Returns a list of attributes corresponding to the registered properties.
   * @nocollapse
   */
  static get observedAttributes() {
    // note: piggy backing on this to ensure we're finalized.
    this.finalize();
    const attributes: string[] = [];
    // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays
    this._classProperties!.forEach((v, p) => {
      const attr = this._attributeNameForProperty(p, v);
      if (attr !== undefined) {
        this._attributeToPropertyMap.set(attr, p);
        attributes.push(attr);
      }
    });
    return attributes;
  }

  /**
   * Ensures the private `_classProperties` property metadata is created.
   * In addition to `finalize` this is also called in `createProperty` to
   * ensure the `@property` decorator can add property metadata.
   */
  /** @nocollapse */
  private static _ensureClassProperties() {
    // ensure private storage for property declarations.
    if (!this.hasOwnProperty(
            JSCompiler_renameProperty('_classProperties', this))) {
      this._classProperties = new Map();
      // NOTE: Workaround IE11 not supporting Map constructor argument.
      const superProperties: PropertyDeclarationMap =
          Object.getPrototypeOf(this)._classProperties;
      if (superProperties !== undefined) {
        superProperties.forEach(
            (v: PropertyDeclaration, k: PropertyKey) =>
                this._classProperties!.set(k, v));
      }
    }
  }

  /**
   * Creates a property accessor on the element prototype if one does not exist
   * and stores a PropertyDeclaration for the property with the given options.
   * The property setter calls the property's `hasChanged` property option
   * or uses a strict identity check to determine whether or not to request
   * an update.
   *
   * This method may be overridden to customize properties; however,
   * when doing so, it's important to call `super.createProperty` to ensure
   * the property is setup correctly. This method calls
   * `getPropertyDescriptor` internally to get a descriptor to install.
   * To customize what properties do when they are get or set, override
   * `getPropertyDescriptor`. To customize the options for a property,
   * implement `createProperty` like this:
   *
   * static createProperty(name, options) {
   *   options = Object.assign(options, {myOption: true});
   *   super.createProperty(name, options);
   * }
   *
   * @nocollapse
   */
  static createProperty(
      name: PropertyKey,
      options: PropertyDeclaration = defaultPropertyDeclaration) {
    // Note, since this can be called by the `@property` decorator which
    // is called before `finalize`, we ensure storage exists for property
    // metadata.
    this._ensureClassProperties();
    this._classProperties!.set(name, options);
    // Do not generate an accessor if the prototype already has one, since
    // it would be lost otherwise and that would never be the user's intention;
    // Instead, we expect users to call `requestUpdate` themselves from
    // user-defined accessors. Note that if the super has an accessor we will
    // still overwrite it
    if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
      return;
    }
    const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
    const descriptor = this.getPropertyDescriptor(name, key, options);
    if (descriptor !== undefined) {
      Object.defineProperty(this.prototype, name, descriptor);
    }
  }

  /**
   * Returns a property descriptor to be defined on the given named property.
   * If no descriptor is returned, the property will not become an accessor.
   * For example,
   *
   *   class MyElement extends LitElement {
   *     static getPropertyDescriptor(name, key, options) {
   *       const defaultDescriptor =
   *           super.getPropertyDescriptor(name, key, options);
   *       const setter = defaultDescriptor.set;
   *       return {
   *         get: defaultDescriptor.get,
   *         set(value) {
   *           setter.call(this, value);
   *           // custom action.
   *         },
   *         configurable: true,
   *         enumerable: true
   *       }
   *     }
   *   }
   *
   * @nocollapse
   */
  protected static getPropertyDescriptor(
      name: PropertyKey, key: string|symbol, options: PropertyDeclaration) {
    return {
      // tslint:disable-next-line:no-any no symbol in index
      get(): any {
        return (this as {[key: string]: unknown})[key as string];
      },
      set(this: UpdatingElement, value: unknown) {
        const oldValue =
            (this as {} as {[key: string]: unknown})[name as string];
        (this as {} as {[key: string]: unknown})[key as string] = value;
        (this as unknown as UpdatingElement)
            .requestUpdateInternal(name, oldValue, options);
      },
      configurable: true,
      enumerable: true
    };
  }

  /**
   * Returns the property options associated with the given property.
   * These options are defined with a PropertyDeclaration via the `properties`
   * object or the `@property` decorator and are registered in
   * `createProperty(...)`.
   *
   * Note, this method should be considered "final" and not overridden. To
   * customize the options for a given property, override `createProperty`.
   *
   * @nocollapse
   * @final
   */
  protected static getPropertyOptions(name: PropertyKey) {
    return this._classProperties && this._classProperties.get(name) ||
        defaultPropertyDeclaration;
  }

  /**
   * Creates property accessors for registered properties and ensures
   * any superclasses are also finalized.
   * @nocollapse
   */
  protected static finalize() {
    // finalize any superclasses
    const superCtor = Object.getPrototypeOf(this);
    if (!superCtor.hasOwnProperty(finalized)) {
      superCtor.finalize();
    }
    this[finalized] = true;
    this._ensureClassProperties();
    // initialize Map populated in observedAttributes
    this._attributeToPropertyMap = new Map();
    // make any properties
    // Note, only process "own" properties since this element will inherit
    // any properties defined on the superClass, and finalization ensures
    // the entire prototype chain is finalized.
    if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
      const props = this.properties;
      // support symbols in properties (IE11 does not support this)
      const propKeys = [
        ...Object.getOwnPropertyNames(props),
        ...(typeof Object.getOwnPropertySymbols === 'function') ?
            Object.getOwnPropertySymbols(props) :
            []
      ];
      // This for/of is ok because propKeys is an array
      for (const p of propKeys) {
        // note, use of `any` is due to TypeSript lack of support for symbol in
        // index types
        // tslint:disable-next-line:no-any no symbol in index
        this.createProperty(p, (props as any)[p]);
      }
    }
  }

  /**
   * Returns the property name for the given attribute `name`.
   * @nocollapse
   */
  private static _attributeNameForProperty(
      name: PropertyKey, options: PropertyDeclaration) {
    const attribute = options.attribute;
    return attribute === false ?
        undefined :
        (typeof attribute === 'string' ?
             attribute :
             (typeof name === 'string' ? name.toLowerCase() : undefined));
  }

  /**
   * Returns true if a property should request an update.
   * Called when a property value is set and uses the `hasChanged`
   * option for the property if present or a strict identity check.
   * @nocollapse
   */
  private static _valueHasChanged(
      value: unknown, old: unknown, hasChanged: HasChanged = notEqual) {
    return hasChanged(value, old);
  }

  /**
   * Returns the property value for the given attribute value.
   * Called via the `attributeChangedCallback` and uses the property's
   * `converter` or `converter.fromAttribute` property option.
   * @nocollapse
   */
  private static _propertyValueFromAttribute(
      value: string|null, options: PropertyDeclaration) {
    const type = options.type;
    const converter = options.converter || defaultConverter;
    const fromAttribute =
        (typeof converter === 'function' ? converter : converter.fromAttribute);
    return fromAttribute ? fromAttribute(value, type) : value;
  }

  /**
   * Returns the attribute value for the given property value. If this
   * returns undefined, the property will *not* be reflected to an attribute.
   * If this returns null, the attribute will be removed, otherwise the
   * attribute will be set to the value.
   * This uses the property's `reflect` and `type.toAttribute` property options.
   * @nocollapse
   */
  private static _propertyValueToAttribute(
      value: unknown, options: PropertyDeclaration) {
    if (options.reflect === undefined) {
      return;
    }
    const type = options.type;
    const converter = options.converter;
    const toAttribute =
        converter && (converter as ComplexAttributeConverter).toAttribute ||
        defaultConverter.toAttribute;
    return toAttribute!(value, type);
  }

  private _updateState!: UpdateState;
  private _instanceProperties?: PropertyValues;
  // Initialize to an unresolved Promise so we can make sure the element has
  // connected before first update.
  private _updatePromise!: Promise<unknown>;
  private _enableUpdatingResolver: (() => void)|undefined;

  /**
   * Map with keys for any properties that have changed since the last
   * update cycle with previous values.
   */
  private _changedProperties!: PropertyValues;

  /**
   * Map with keys of properties that should be reflected when updated.
   */
  private _reflectingProperties?: Map<PropertyKey, PropertyDeclaration>;

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Performs element initialization. By default captures any pre-set values for
   * registered properties.
   */
  protected initialize() {
    this._updateState = 0;
    this._updatePromise =
        new Promise((res) => this._enableUpdatingResolver = res);
    this._changedProperties = new Map();
    this._saveInstanceProperties();
    // ensures first update will be caught by an early access of
    // `updateComplete`
    this.requestUpdateInternal();
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
  private _saveInstanceProperties() {
    // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays
    (this.constructor as typeof UpdatingElement)
        ._classProperties!.forEach((_v, p) => {
          if (this.hasOwnProperty(p)) {
            const value = this[p as keyof this];
            delete this[p as keyof this];
            if (!this._instanceProperties) {
              this._instanceProperties = new Map();
            }
            this._instanceProperties.set(p, value);
          }
        });
  }

  /**
   * Applies previously saved instance properties.
   */
  private _applyInstanceProperties() {
    // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays
    // tslint:disable-next-line:no-any
    this._instanceProperties!.forEach((v, p) => (this as any)[p] = v);
    this._instanceProperties = undefined;
  }

  connectedCallback() {
    // Ensure first connection completes an update. Updates cannot complete
    // before connection.
    this.enableUpdating();
  }

  protected enableUpdating() {
    if (this._enableUpdatingResolver !== undefined) {
      this._enableUpdatingResolver();
      this._enableUpdatingResolver = undefined;
    }
  }

  /**
   * Allows for `super.disconnectedCallback()` in extensions while
   * reserving the possibility of making non-breaking feature additions
   * when disconnecting at some point in the future.
   */
  disconnectedCallback() {
  }

  /**
   * Synchronizes property values when attributes change.
   */
  attributeChangedCallback(name: string, old: string|null, value: string|null) {
    if (old !== value) {
      this._attributeToProperty(name, value);
    }
  }

  private _propertyToAttribute(
      name: PropertyKey, value: unknown,
      options: PropertyDeclaration = defaultPropertyDeclaration) {
    const ctor = (this.constructor as typeof UpdatingElement);
    const attr = ctor._attributeNameForProperty(name, options);
    if (attr !== undefined) {
      const attrValue = ctor._propertyValueToAttribute(value, options);
      // an undefined value does not change the attribute.
      if (attrValue === undefined) {
        return;
      }
      // Track if the property is being reflected to avoid
      // setting the property again via `attributeChangedCallback`. Note:
      // 1. this takes advantage of the fact that the callback is synchronous.
      // 2. will behave incorrectly if multiple attributes are in the reaction
      // stack at time of calling. However, since we process attributes
      // in `update` this should not be possible (or an extreme corner case
      // that we'd like to discover).
      // mark state reflecting
      this._updateState = this._updateState | STATE_IS_REFLECTING_TO_ATTRIBUTE;
      if (attrValue == null) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, attrValue as string);
      }
      // mark state not reflecting
      this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_ATTRIBUTE;
    }
  }

  private _attributeToProperty(name: string, value: string|null) {
    // Use tracking info to avoid deserializing attribute value if it was
    // just set from a property setter.
    if (this._updateState & STATE_IS_REFLECTING_TO_ATTRIBUTE) {
      return;
    }
    const ctor = (this.constructor as typeof UpdatingElement);
    // Note, hint this as an `AttributeMap` so closure clearly understands
    // the type; it has issues with tracking types through statics
    // tslint:disable-next-line:no-unnecessary-type-assertion
    const propName = (ctor._attributeToPropertyMap as AttributeMap).get(name);
    if (propName !== undefined) {
      const options = ctor.getPropertyOptions(propName);
      // mark state reflecting
      this._updateState = this._updateState | STATE_IS_REFLECTING_TO_PROPERTY;
      this[propName as keyof this] =
          // tslint:disable-next-line:no-any
          ctor._propertyValueFromAttribute(value, options) as any;
      // mark state not reflecting
      this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_PROPERTY;
    }
  }

  /**
   * This protected version of `requestUpdate` does not access or return the
   * `updateComplete` promise. This promise can be overridden and is therefore
   * not free to access.
   */
  protected requestUpdateInternal(
      name?: PropertyKey, oldValue?: unknown, options?: PropertyDeclaration) {
    let shouldRequestUpdate = true;
    // If we have a property key, perform property update steps.
    if (name !== undefined) {
      const ctor = this.constructor as typeof UpdatingElement;
      options = options || ctor.getPropertyOptions(name);
      if (ctor._valueHasChanged(
              this[name as keyof this], oldValue, options.hasChanged)) {
        if (!this._changedProperties.has(name)) {
          this._changedProperties.set(name, oldValue);
        }
        // Add to reflecting properties set.
        // Note, it's important that every change has a chance to add the
        // property to `_reflectingProperties`. This ensures setting
        // attribute + property reflects correctly.
        if (options.reflect === true &&
            !(this._updateState & STATE_IS_REFLECTING_TO_PROPERTY)) {
          if (this._reflectingProperties === undefined) {
            this._reflectingProperties = new Map();
          }
          this._reflectingProperties.set(name, options);
        }
      } else {
        // Abort the request if the property should not be considered changed.
        shouldRequestUpdate = false;
      }
    }
    if (!this._hasRequestedUpdate && shouldRequestUpdate) {
      this._updatePromise = this._enqueueUpdate();
    }
  }

  /**
   * Requests an update which is processed asynchronously. This should
   * be called when an element should update based on some state not triggered
   * by setting a property. In this case, pass no arguments. It should also be
   * called when manually implementing a property setter. In this case, pass the
   * property `name` and `oldValue` to ensure that any configured property
   * options are honored. Returns the `updateComplete` Promise which is resolved
   * when the update completes.
   *
   * @param name {PropertyKey} (optional) name of requesting property
   * @param oldValue {any} (optional) old value of requesting property
   * @returns {Promise} A Promise that is resolved when the update completes.
   */
  requestUpdate(name?: PropertyKey, oldValue?: unknown) {
    this.requestUpdateInternal(name, oldValue);
    return this.updateComplete;
  }

  /**
   * Sets up the element to asynchronously update.
   */
  private async _enqueueUpdate() {
    this._updateState = this._updateState | STATE_UPDATE_REQUESTED;
    try {
      // Ensure any previous update has resolved before updating.
      // This `await` also ensures that property changes are batched.
      await this._updatePromise;
    } catch (e) {
      // Ignore any previous errors. We only care that the previous cycle is
      // done. Any error should have been handled in the previous update.
    }
    const result = this.performUpdate();
    // If `performUpdate` returns a Promise, we await it. This is done to
    // enable coordinating updates with a scheduler. Note, the result is
    // checked to avoid delaying an additional microtask unless we need to.
    if (result != null) {
      await result;
    }
    return !this._hasRequestedUpdate;
  }

  private get _hasRequestedUpdate() {
    return (this._updateState & STATE_UPDATE_REQUESTED);
  }

  protected get hasUpdated() {
    return (this._updateState & STATE_HAS_UPDATED);
  }

  /**
   * Performs an element update. Note, if an exception is thrown during the
   * update, `firstUpdated` and `updated` will not be called.
   *
   * You can override this method to change the timing of updates. If this
   * method is overridden, `super.performUpdate()` must be called.
   *
   * For instance, to schedule updates to occur just before the next frame:
   *
   * ```
   * protected async performUpdate(): Promise<unknown> {
   *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
   *   super.performUpdate();
   * }
   * ```
   */
  protected performUpdate(): void|Promise<unknown> {
    // Abort any update if one is not pending when this is called.
    // This can happen if `performUpdate` is called early to "flush"
    // the update.
    if (!this._hasRequestedUpdate) {
      return;
    }
    // Mixin instance properties once, if they exist.
    if (this._instanceProperties) {
      this._applyInstanceProperties();
    }
    let shouldUpdate = false;
    const changedProperties = this._changedProperties;
    try {
      shouldUpdate = this.shouldUpdate(changedProperties);
      if (shouldUpdate) {
        this.update(changedProperties);
      } else {
        this._markUpdated();
      }
    } catch (e) {
      // Prevent `firstUpdated` and `updated` from running when there's an
      // update exception.
      shouldUpdate = false;
      // Ensure element can accept additional updates after an exception.
      this._markUpdated();
      throw e;
    }
    if (shouldUpdate) {
      if (!(this._updateState & STATE_HAS_UPDATED)) {
        this._updateState = this._updateState | STATE_HAS_UPDATED;
        this.firstUpdated(changedProperties);
      }
      this.updated(changedProperties);
    }
  }

  private _markUpdated() {
    this._changedProperties = new Map();
    this._updateState = this._updateState & ~STATE_UPDATE_REQUESTED;
  }

  /**
   * Returns a Promise that resolves when the element has completed updating.
   * The Promise value is a boolean that is `true` if the element completed the
   * update without triggering another update. The Promise result is `false` if
   * a property was set inside `updated()`. If the Promise is rejected, an
   * exception was thrown during the update.
   *
   * To await additional asynchronous work, override the `_getUpdateComplete`
   * method. For example, it is sometimes useful to await a rendered element
   * before fulfilling this Promise. To do this, first await
   * `super._getUpdateComplete()`, then any subsequent state.
   *
   * @returns {Promise} The Promise returns a boolean that indicates if the
   * update resolved without triggering another update.
   */
  get updateComplete() {
    return this._getUpdateComplete();
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
   *   class MyElement extends LitElement {
   *     async _getUpdateComplete() {
   *       await super._getUpdateComplete();
   *       await this._myChild.updateComplete;
   *     }
   *   }
   */
  protected _getUpdateComplete() {
    return this._updatePromise;
  }

  /**
   * Controls whether or not `update` should be called when the element requests
   * an update. By default, this method always returns `true`, but this can be
   * customized to control when to update.
   *
   * @param _changedProperties Map of changed properties with old values
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
   */
  protected update(_changedProperties: PropertyValues) {
    if (this._reflectingProperties !== undefined &&
        this._reflectingProperties.size > 0) {
      // Use forEach so this works even if for/of loops are compiled to for
      // loops expecting arrays
      this._reflectingProperties.forEach(
          (v, k) => this._propertyToAttribute(k, this[k as keyof this], v));
      this._reflectingProperties = undefined;
    }
    this._markUpdated();
  }

  /**
   * Invoked whenever the element is updated. Implement to perform
   * post-updating tasks via DOM APIs, for example, focusing an element.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   */
  protected updated(_changedProperties: PropertyValues) {
  }

  /**
   * Invoked when the element is first updated. Implement to perform one time
   * work on the element after update.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   */
  protected firstUpdated(_changedProperties: PropertyValues) {
  }
}
