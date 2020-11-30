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
window.JSCompiler_renameProperty = <P extends PropertyKey>(
  prop: P,
  _obj: unknown
): P => prop;

declare global {
  const JSCompiler_renameProperty: <P extends PropertyKey>(
    prop: P,
    _obj: unknown
  ) => P;

  interface Window {
    JSCompiler_renameProperty: typeof JSCompiler_renameProperty;
  }
}

/**
 * Defines options for a property accessor.
 */
export interface PropertyDeclaration<Type = unknown, TypeHint = unknown> {
  /**
   * Indicates the type of the property. This is used only as a hint for the
   * `converter` to determine how to convert the attribute
   * to/from a property.
   */
  readonly type?: TypeHint;

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

/**
 * Map of changed properties with old values. Takes an optional generic
 * interface corresponding to the declared element properties.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PropertyValues<T = any> = keyof T extends PropertyKey
  ? Map<keyof T, unknown>
  : never;

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
  type: String,
  hasChanged: notEqual,
};

/**
 * The Closure JS Compiler doesn't currently have good support for static
 * property semantics where "this" is dynamic (e.g.
 * https://github.com/google/closure-compiler/issues/3177 and others) so we use
 * this hack to bypass any rewriting by the compiler.
 */
const finalized = 'finalized';

/**
 * Base mixin which manages a set of properties that can request an update.
 * The actual update mechanism is not handled here and should instead be
 * implemented by a base class.
 * @noInheritDoc
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

// Note: `UpdatingMixinBase` and `UpdatingMixinStatics` exist to be able to type
// the output of the `UpdatingMixin` function. They work around the TypeScript
// limitation (for the non-static side) that visibility modifiers cannot be
// used with mixins.

// TODO(sorvell): Using this pattern, static members cannot use visibility
// modifiers (protected). Considering this ok since these are static
// (not often used) members.
export declare class UpdatingMixinBaseStatics {
  [finalized]: boolean;
  classProperties: PropertyDeclarationMap;
  properties: PropertyDeclarations;

  createProperty(_name: PropertyKey, _options: PropertyDeclaration): void;

  getPropertyDescriptor(
    _name: PropertyKey,
    _key: string | symbol,
    _options: PropertyDeclaration
  ): PropertyDescriptor;

  getPropertyOptions(_name: PropertyKey): PropertyDeclaration;

  finalize(): boolean;
}

export declare class UpdatingMixinBase {
  protected _changedProperties: PropertyValues;

  requestUpdate(
    _name?: PropertyKey,
    _oldValue?: unknown,
    _options?: PropertyDeclaration
  ): unknown;

  protected _propertyChanged(
    _name: PropertyKey,
    _oldValue: unknown,
    _options: PropertyDeclaration
  ): void;

  protected _scheduleUpdate(): void;

  protected _resolveUpdate(): void;

  connectedCallback?(): void;

  disconnectedCallback?(): void;

  protected willUpdate?(changedProperties: PropertyValues): void;

  protected update?(changedProperties: PropertyValues): void;

  protected updated?(changedProperties: PropertyValues): void;
}

/**
 * `UpdatingMixin` is a mixin that creates reactive properties defined using the
 * `static properties` property or the `@property` decorator. It provides
 * an interface for an update lifecycle which must be implemented by the
 * subclass, including requestUpdate, willUpdate, update, and didUpdate.
 */
export function UpdatingMixin<T extends Constructor>(Base: T) {
  class UpdatingComponent extends Base {
    /**
     * Marks class as having finished creating properties.
     */
    //@internal
    protected static [finalized] = true;

    /**
     * Memoized list of all element properties, including any superclass properties.
     * Created lazily on user subclasses when finalizing the class.
     */
    static classProperties?: PropertyDeclarationMap;

    /**
     * User-supplied object that maps property names to `PropertyDeclaration`
     * objects containing options for configuring the property.
     */
    static properties: PropertyDeclarations;

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
      options: PropertyDeclaration = defaultPropertyDeclaration
    ) {
      // Note, since this can be called by the `@property` decorator which
      // is called before `finalize`, we ensure finalization has been kicked off.
      this.finalize();
      this.classProperties!.set(name, options);
      // Do not generate an accessor if the prototype already has one, since
      // it would be lost otherwise and that would never be the user's intention;
      // Instead, we expect users to call `requestUpdate` themselves from
      // user-defined accessors. Note that if the super has an accessor we will
      // still overwrite it
      if (!options.noAccessor && !this.prototype.hasOwnProperty(name)) {
        const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
        const descriptor = this.getPropertyDescriptor(name, key, options);
        if (descriptor !== undefined) {
          Object.defineProperty(this.prototype, name, descriptor);
        }
      }
    }

    /**
     * Returns a property descriptor to be defined on the given named property.
     * If no descriptor is returned, the property will not become an accessor.
     * For example,
     *
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
     *
     * @nocollapse
     */
    protected static getPropertyDescriptor(
      name: PropertyKey,
      key: string | symbol,
      options: PropertyDeclaration
    ) {
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        get(): any {
          return (this as {[key: string]: unknown})[key as string];
        },
        set(this: UpdatingComponent, value: unknown) {
          const oldValue = ((this as {}) as {[key: string]: unknown})[
            name as string
          ];
          ((this as {}) as {[key: string]: unknown})[key as string] = value;
          ((this as unknown) as UpdatingComponent).requestUpdate(
            name,
            oldValue,
            options
          );
        },
        configurable: true,
        enumerable: true,
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
     * @internal
     */
    protected static getPropertyOptions(name: PropertyKey) {
      return this.classProperties!.get(name) || defaultPropertyDeclaration;
    }

    /**
     * Creates property accessors for registered properties and ensures any
     * superclasses are also finalized. Returns true if the element was
     * finalized.
     * @nocollapse
     * @internal
     */
    protected static finalize() {
      if (this.hasOwnProperty(finalized)) {
        return false;
      }
      this[finalized] = true;
      // finalize any superclasses
      const superCtor = Object.getPrototypeOf(this) as typeof UpdatingComponent;
      superCtor.finalize();
      this.classProperties = new Map(superCtor.classProperties!);
      // initialize Map populated in observedAttributes
      // make any properties
      // Note, only process "own" properties since this element will inherit
      // any properties defined on the superClass, and finalization ensures
      // the entire prototype chain is finalized.
      if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
        const props = this.properties;
        // support symbols in properties (IE11 does not support this)
        const propKeys = [
          ...Object.getOwnPropertyNames(props),
          ...Object.getOwnPropertySymbols(props),
        ];
        // This for/of is ok because propKeys is an array
        for (const p of propKeys) {
          // note, use of `any` is due to TypeScript lack of support for symbol in
          // index types
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.createProperty(p, (props as any)[p]);
        }
      }
      return true;
    }

    /**
     * Map with keys for any properties that have changed since the last
     * update cycle with previous values.
     */
    // @internal
    protected _changedProperties: PropertyValues;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      this._changedProperties = new Map();
    }

    /**
     * Requests an update which is processed asynchronously. This should be called
     * when an element should update based on some state not triggered by setting
     * a reactive property. In this case, pass no arguments. It should also be
     * called when manually implementing a property setter. In this case, pass the
     * property `name` and `oldValue` to ensure that any configured property
     * options are honored.
     *
     * @param name {PropertyKey} (optional) name of requesting property
     * @param oldValue {any} (optional) old value of requesting property
     * @param options {PropertyDeclaration} (optional) property options to use
     * instead of the previously configured options
     */
    requestUpdate(
      name?: PropertyKey,
      oldValue?: unknown,
      options?: PropertyDeclaration
    ) {
      let needsUpdate = true;
      if (name !== undefined) {
        options =
          options ||
          (this.constructor as typeof UpdatingComponent).getPropertyOptions(
            name
          );
        needsUpdate = (options.hasChanged || notEqual)(
          this[name as keyof this],
          oldValue
        );
        if (needsUpdate) {
          this._propertyChanged(name, oldValue, options);
        }
      }
      if (needsUpdate) {
        this._scheduleUpdate();
      }
    }

    // @internal
    protected _propertyChanged(
      name: PropertyKey,
      oldValue: unknown,
      _options: PropertyDeclaration
    ) {
      if (!this._changedProperties.has(name)) {
        this._changedProperties.set(name, oldValue);
      }
    }

    // @internal
    protected _scheduleUpdate() {}

    protected _resolveUpdate() {
      this._changedProperties = new Map();
    }

    connectedCallback?(): void;

    disconnectedCallback?(): void;

    protected willUpdate?(changedProperties: PropertyValues): void;

    protected update?(changedProperties: PropertyValues): void;

    protected updated?(changedProperties: PropertyValues): void;
  }
  return (UpdatingComponent as unknown) as T &
    Constructor<UpdatingMixinBase> &
    UpdatingMixinBaseStatics;
}
