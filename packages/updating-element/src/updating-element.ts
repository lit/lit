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
import {
  UpdatingMixin,
  PropertyValues,
  PropertyDeclaration as MixinPropertyDeclaration,
  notEqual,
} from './updating-mixin.js';
export {PropertyValues, notEqual} from './updating-mixin.js';

import {
  getCompatibleStyle,
  adoptStyles,
  CSSResultGroup,
  CSSResultOrNative,
  CSSResultFlatArray,
} from './css-tag.js';
export * from './css-tag.js';

const DEV_MODE = true;

let requestUpdateThenable: {
  then: (
    onfulfilled?: (value: boolean) => void,
    _onrejected?: () => void
  ) => void;
};

if (DEV_MODE) {
  // TODO(sorvell): Add a link to the docs about using dev v. production mode.
  console.warn(`Running in dev mode. Do not use in production!`);

  // Issue platform support warning.
  if (
    window.ShadyDOM?.inUse &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)['updatingElementPlatformSupport'] === undefined
  ) {
    console.warn(
      `Shadow DOM is being polyfilled via ShadyDOM but ` +
        `the \`platform-support\` module has not been loaded.`
    );
  }

  requestUpdateThenable = {
    then: (
      onfulfilled?: (value: boolean) => void,
      _onrejected?: () => void
    ) => {
      console.warn(
        `\`requestUpdate\` no longer returns a Promise.` +
          `Use \`updateComplete\` instead.`
      );
      if (onfulfilled !== undefined) {
        onfulfilled(false);
      }
    },
  };
}

/**
 * Converts property values to and from attribute values.
 */
export interface ComplexAttributeConverter<Type = unknown, TypeHint = unknown> {
  /**
   * Function called to convert an attribute value to a property
   * value.
   */
  fromAttribute?(value: string | null, type?: TypeHint): Type;

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
  | ComplexAttributeConverter<Type>
  | ((value: string | null, type?: TypeHint) => Type);

/**
 * Defines options for a property accessor.
 */
export interface PropertyDeclaration<Type = unknown, TypeHint = unknown>
  extends MixinPropertyDeclaration {
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
}

/**
 * Map of properties to PropertyDeclaration options. For each property an
 * accessor is made, and the property is processed according to the
 * PropertyDeclaration options.
 */
export interface PropertyDeclarations {
  readonly [key: string]: PropertyDeclaration;
}

// type PropertyDeclarationMap = Map<PropertyKey, PropertyDeclaration>;

type AttributeMap = Map<string, PropertyKey>;

export const defaultConverter: ComplexAttributeConverter = {
  toAttribute(value: unknown, type?: unknown): unknown {
    switch (type) {
      case Boolean:
        value = value ? '' : null;
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

const defaultPropertyDeclaration: PropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual,
};

export interface Controller {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  willUpdate?(): void;
  update?(): void;
  updated?(): void;
  requestUpdate?(): void;
}

export type Warnings = 'change-in-update' | 'migration';

/**
 * Base element class which manages element properties and attributes. When
 * properties change, the `update` method is asynchronously called. This method
 * should be supplied by subclassers to render updates as desired.
 * @noInheritDoc
 */
export abstract class UpdatingElement extends UpdatingMixin(HTMLElement) {
  /*
   * Due to closure compiler ES6 compilation bugs, @nocollapse is required on
   * all static methods and properties with initializers.  Reference:
   * - https://github.com/google/closure-compiler/issues/1776
   */

  // Note, these are patched in only in DEV_MODE.
  static enabledWarnings?: Warnings[];
  static enableWarning?: (type: Warnings) => void;
  static disableWarning?: (type: Warnings) => void;

  static properties: PropertyDeclarations;

  /**
   * Maps attribute names to properties; for example `foobar` attribute to
   * `fooBar` property. Created lazily on user subclasses when finalizing the
   * class.
   */
  private static _attributeToPropertyMap: AttributeMap;

  /**
   * Memoized list of all element styles.
   * Created lazily on user subclasses when finalizing the class.
   */
  static classStyles?: CSSResultFlatArray;

  /**
   * Array of styles to apply to the element. The styles should be defined
   * using the [[`css`]] tag function or via constructible stylesheets.
   */
  static styles?: CSSResultGroup;

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
    this.classProperties!.forEach((v, p) => {
      const attr = this._attributeNameForProperty(p, v);
      if (attr !== undefined) {
        this._attributeToPropertyMap.set(attr, p);
        attributes.push(attr);
      }
    });
    return attributes;
  }

  /**
   * Creates property accessors for registered properties, sets up element
   * styling, and ensures any superclasses are also finalized. Returns true if
   * the element was finalized.
   * @nocollapse
   */
  static finalize() {
    const didFinalize = super.finalize();
    if (didFinalize) {
      this._attributeToPropertyMap = new Map();
      this.classStyles = this.finalizeStyles(this.styles);
      // DEV mode warnings
      if (DEV_MODE) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const warnRemoved = (obj: any, name: string) => {
          if (obj[name] !== undefined) {
            console.warn(
              `\`${name}\` is implemented. It ` +
                `has been removed from this version of UpdatingElement. `
              // TODO(sorvell): add link to changelog when location has stabilized.
              // See the changelog at https://github.com/Polymer/lit-html/blob/lit-next/packages/updating-element/CHANGELOG.md`
            );
          }
        };
        [`initialize`, `requestUpdateInternal`, `_getUpdateComplete`].forEach(
          (name: string) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            warnRemoved(this.prototype as any, name)
        );
      }
    }
    return didFinalize;
  }

  /**
   * Options used when calling `attachShadow`. Set this property to customize
   * the options for the shadowRoot; for example, to create a closed
   * shadowRoot: `{mode: 'closed'}`.
   *
   * Note, these options are used in `createRenderRoot`. If this method
   * is customized, options should be respected if possible.
   */
  static shadowRootOptions: ShadowRootInit = {mode: 'open'};

  /**
   * Takes the styles the user supplied via the `static styles` property and
   * returns the array of styles to apply to the element.
   * Override this method to integrate into a style management system.
   *
   * Styles are de-duplicated preserving the _last_ instance in the list. This
   * is a performance optimization to avoid duplicated styles that can occur
   * especially when composing via subclassing. The last item is kept to try
   * to preserve the cascade order with the assumption that it's most important
   * that last added styles override previous styles.
   *
   * @nocollapse
   */
  protected static finalizeStyles(styles?: CSSResultGroup): CSSResultFlatArray {
    const classStyles = [];
    if (Array.isArray(styles)) {
      // Dedupe the flattened array in reverse order to preserve the last items.
      // TODO(sorvell): casting to Array<unknown> works around TS error that
      // appears to come from trying to flatten a type CSSResultArray.
      const set = new Set((styles as Array<unknown>).flat(Infinity).reverse());
      // Then preserve original order by adding the set items in reverse order.
      for (const s of set) {
        classStyles.unshift(getCompatibleStyle(s as CSSResultOrNative));
      }
    } else if (styles !== undefined) {
      classStyles.push(getCompatibleStyle(styles));
    }
    return classStyles;
  }

  /**
   * Node or ShadowRoot into which element DOM should be rendered. Defaults
   * to an open shadowRoot.
   */
  readonly renderRoot!: HTMLElement | ShadowRoot;

  /**
   * Returns the property name for the given attribute `name`.
   * @nocollapse
   */
  private static _attributeNameForProperty(
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

  private _instanceProperties?: PropertyValues = new Map();
  // Initialize to an unresolved Promise so we can make sure the element has
  // connected before first update.
  private _updatePromise!: Promise<unknown>;

  private _pendingConnectionPromise: Promise<unknown> | undefined = undefined;
  private _enableConnection: (() => void) | undefined = undefined;

  isUpdatePending = false;
  hasUpdated = false;

  /**
   * Map with keys of properties that should be reflected when updated.
   */
  private _reflectingProperties?: Map<PropertyKey, PropertyDeclaration>;

  /**
   * Name of currently reflecting property
   */
  private _reflectingProperty: PropertyKey | null = null;

  /**
   * Set of controllers.
   */
  _controllers?: Controller[];

  constructor() {
    super();
    this._updatePromise = new Promise((res) => (this.enableUpdating = res));
    this._saveInstanceProperties();
    // ensures first update will be caught by an early access of
    // `updateComplete`
    this.requestUpdate();
  }

  addController(controller: Controller) {
    (this._controllers ??= []).push(controller);
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
    (this.constructor as typeof UpdatingElement).classProperties!.forEach(
      (_v, p) => {
        if (this.hasOwnProperty(p)) {
          this._instanceProperties!.set(p, this[p as keyof this]);
          delete this[p as keyof this];
        }
      }
    );
  }

  /**
   * Returns the node into which the element should render and by default
   * creates and returns an open shadowRoot. Implement to customize where the
   * element's DOM is rendered. For example, to render into the element's
   * childNodes, return `this`.
   *
   * @return Returns a node into which to render.
   */
  protected createRenderRoot(): Element | ShadowRoot {
    const renderRoot =
      this.shadowRoot ??
      this.attachShadow(
        (this.constructor as typeof UpdatingElement).shadowRootOptions
      );
    adoptStyles(
      renderRoot,
      (this.constructor as typeof UpdatingElement).classStyles!
    );
    return renderRoot;
  }

  /**
   * On first connection, creates the element's renderRoot, sets up
   * element styling, and enables updating.
   */
  connectedCallback() {
    // create renderRoot before first update.
    if (!this.hasUpdated) {
      (this as {
        renderRoot: Element | DocumentFragment;
      }).renderRoot = this.createRenderRoot();
    }
    this.enableUpdating();
    this._controllers?.forEach((c) => c.connectedCallback?.());
    // If we were disconnected, re-enable updating by resolving the pending
    // connection promise
    if (this._enableConnection) {
      this._enableConnection();
      this._pendingConnectionPromise = this._enableConnection = undefined;
    }
  }

  /**
   * Note, this method should be considered final and not overridden. It is
   * overridden on the element instance with a function that triggers the first
   * update.
   */
  protected enableUpdating() {}

  /**
   * Allows for `super.disconnectedCallback()` in extensions while
   * reserving the possibility of making non-breaking feature additions
   * when disconnecting at some point in the future.
   */
  disconnectedCallback() {
    this._controllers?.forEach((c) => c.disconnectedCallback?.());
    this._pendingConnectionPromise = new Promise(
      (r) => (this._enableConnection = r)
    );
  }

  /**
   * Synchronizes property values when attributes change.
   */
  attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null
  ) {
    this._$attributeToProperty(name, value);
  }

  private _propertyToAttribute(
    name: PropertyKey,
    value: unknown,
    options: PropertyDeclaration = defaultPropertyDeclaration
  ) {
    const attr = (this
      .constructor as typeof UpdatingElement)._attributeNameForProperty(
      name,
      options
    );
    if (attr !== undefined && options.reflect === true) {
      const toAttribute =
        (options.converter as ComplexAttributeConverter)?.toAttribute ??
        defaultConverter.toAttribute;
      const attrValue = toAttribute!(value, options.type);
      if (
        DEV_MODE &&
        (this.constructor as typeof UpdatingElement).enabledWarnings!.indexOf(
          'migration'
        ) >= 0 &&
        attrValue === undefined
      ) {
        console.warn(
          `The attribute value for the ` +
            `${name as string} property is undefined. The attribute will be ` +
            `removed, but in the previous version of UpdatingElement, the ` +
            `attribute would not have changed.`
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
      this._reflectingProperty = name;
      if (attrValue == null) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, attrValue as string);
      }
      // mark state not reflecting
      this._reflectingProperty = null;
    }
  }

  /** @internal */
  _$attributeToProperty(name: string, value: string | null) {
    const ctor = this.constructor as typeof UpdatingElement;
    // Note, hint this as an `AttributeMap` so closure clearly understands
    // the type; it has issues with tracking types through statics
    const propName = (ctor._attributeToPropertyMap as AttributeMap).get(name);
    // Use tracking info to avoid reflecting a property value to an attribute
    // if it was just set because the attribute changed.
    if (propName !== undefined && this._reflectingProperty !== propName) {
      const options = ctor.getPropertyOptions(propName);
      const converter = (options as PropertyDeclaration).converter;
      const fromAttribute =
        (converter as ComplexAttributeConverter)?.fromAttribute ??
        (typeof converter === 'function'
          ? (converter as (value: string | null, type?: unknown) => unknown)
          : null) ??
        defaultConverter.fromAttribute;
      // mark state reflecting
      this._reflectingProperty = propName;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this[propName as keyof this] = fromAttribute!(value, options.type) as any;
      // mark state not reflecting
      this._reflectingProperty = null;
    }
  }

  protected _propertyChanged(
    name: PropertyKey,
    oldValue: unknown,
    options: PropertyDeclaration
  ) {
    super._propertyChanged(name, oldValue, options);
    // Add to reflecting properties set.
    // Note, it's important that every change has a chance to add the
    // property to `_reflectingProperties`. This ensures setting
    // attribute + property reflects correctly.
    if (options.reflect === true && this._reflectingProperty !== name) {
      if (this._reflectingProperties === undefined) {
        this._reflectingProperties = new Map();
      }
      this._reflectingProperties.set(name, options);
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
   */
  requestUpdate(
    name?: PropertyKey,
    oldValue?: unknown,
    options?: PropertyDeclaration
  ) {
    super.requestUpdate(name, oldValue, options);
    // Note, since this no longer returns a promise, in dev mode we return a
    // thenable which warns if it's called.
    return DEV_MODE ? requestUpdateThenable : undefined;
  }

  protected _scheduleUpdate() {
    if (!this.isUpdatePending) {
      this._updatePromise = this._enqueueUpdate();
    }
  }

  /**
   * Sets up the element to asynchronously update.
   */
  private async _enqueueUpdate() {
    this.isUpdatePending = true;
    try {
      // Ensure any previous update has resolved before updating.
      // This `await` also ensures that property changes are batched.
      await this._updatePromise;
      // If we were disconnected, wait until re-connected to flush an update
      while (this._pendingConnectionPromise) {
        await this._pendingConnectionPromise;
      }
    } catch (e) {
      // Refire any previous errors async so they do not disrupt the update
      // cycle. Errors are refired so developers have a chance to observe
      // them, and this can be done by implementing
      // `window.onunhandledrejection`.
      Promise.reject(e);
    }
    const result = this.performUpdate();
    // If `performUpdate` returns a Promise, we await it. This is done to
    // enable coordinating updates with a scheduler. Note, the result is
    // checked to avoid delaying an additional microtask unless we need to.
    if (result != null) {
      await result;
    }
    return !this.isUpdatePending;
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
  protected performUpdate(): void | Promise<unknown> {
    // Abort any update if one is not pending when this is called.
    // This can happen if `performUpdate` is called early to "flush"
    // the update.
    if (!this.isUpdatePending) {
      return;
    }
    // create renderRoot before first update.
    if (!this.hasUpdated) {
      // Produce warning if any class properties are shadowed by class fields
      if (DEV_MODE) {
        const shadowedProperties: string[] = [];
        (this.constructor as typeof UpdatingElement).classProperties!.forEach(
          (_v, p) => {
            if (this.hasOwnProperty(p) && !this._instanceProperties?.has(p)) {
              shadowedProperties.push(p as string);
            }
          }
        );
        if (shadowedProperties.length) {
          // TODO(sorvell): Link to docs explanation of this issue.
          console.warn(
            `The following properties will not trigger updates as expected ` +
              `because they are set using class fields: ` +
              `${shadowedProperties.join(', ')}. ` +
              `Native class fields and some compiled output will overwrite ` +
              `accessors used for detecting changes. To fix this issue, ` +
              `either initialize properties in the constructor or adjust ` +
              `your compiler settings; for example, for TypeScript set ` +
              `\`useDefineForClassFields: false\` in your \`tsconfig.json\`.`
          );
        }
      }
    }
    // Mixin instance properties once, if they exist.
    if (this._instanceProperties) {
      // Use forEach so this works even if for/of loops are compiled to for loops
      // expecting arrays
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._instanceProperties!.forEach((v, p) => ((this as any)[p] = v));
      this._instanceProperties = undefined;
    }
    let shouldUpdate = false;
    const changedProperties = this._changedProperties;
    try {
      shouldUpdate = this.shouldUpdate(changedProperties);
      if (shouldUpdate) {
        this._controllers?.forEach((c) => c.willUpdate?.());
        this.willUpdate(changedProperties);
        this._controllers?.forEach((c) => c.update?.());
        this.update(changedProperties);
      } else {
        this._resolveUpdate();
      }
    } catch (e) {
      // Prevent `firstUpdated` and `updated` from running when there's an
      // update exception.
      shouldUpdate = false;
      // Ensure element can accept additional updates after an exception.
      this._resolveUpdate();
      throw e;
    }
    // The update is no longer considered pending and further updates are now allowed.
    if (shouldUpdate) {
      this._$didUpdate(changedProperties);
    }
  }

  //@internal
  protected _resolveUpdate() {
    super._resolveUpdate();
    this.isUpdatePending = false;
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

  protected willUpdate(_changedProperties: PropertyValues) {}

  /**
   * Updates the element. This method reflects property values to attributes.
   * It can be overridden to render and keep updated element DOM.
   * Setting properties inside this method will *not* trigger
   * another update.
   *
   * @param _changedProperties Map of changed properties with old values
   */
  protected update(_changedProperties: PropertyValues) {
    if (this._reflectingProperties !== undefined) {
      // Use forEach so this works even if for/of loops are compiled to for
      // loops expecting arrays
      this._reflectingProperties.forEach((v, k) =>
        this._propertyToAttribute(k, this[k as keyof this], v)
      );
      this._reflectingProperties = undefined;
    }
    this._resolveUpdate();
  }

  // Note, this is an override point for platform-support.
  protected _$didUpdate(changedProperties: PropertyValues) {
    if (!this.hasUpdated) {
      this.hasUpdated = true;
      this.firstUpdated(changedProperties);
    }
    this._controllers?.forEach((c) => c.updated?.());
    this.updated(changedProperties);
    if (
      DEV_MODE &&
      this.isUpdatePending &&
      (this.constructor as typeof UpdatingElement).enabledWarnings!.indexOf(
        'change-in-update'
      ) >= 0
    ) {
      console.warn(
        `An update was requested (generally because a property was set) ` +
          `after an update completed, causing a new update to be scheduled. ` +
          `This is inefficient and should be avoided unless the next update ` +
          `can only be scheduled as a side effect of the previous update.`
      );
    }
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
  protected firstUpdated(_changedProperties: PropertyValues) {}

  /**
   * Invoked whenever the element is updated. Implement to perform
   * post-updating tasks via DOM APIs, for example, focusing an element.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   */
  protected updated(_changedProperties: PropertyValues) {}

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
   * @return A promise of a boolean that indicates if the update resolved
   *     without triggering another update.
   */
  get updateComplete() {
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
   *   class MyElement extends LitElement {
   *     async getUpdateComplete() {
   *       await super.getUpdateComplete();
   *       await this._myChild.updateComplete;
   *     }
   *   }
   */
  protected getUpdateComplete() {
    return this._updatePromise;
  }
}

// Apply polyfills if available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)['updatingElementPlatformSupport']?.({UpdatingElement});

// Dev mode warnings...
if (DEV_MODE) {
  // Default warning set.
  UpdatingElement.enabledWarnings = ['change-in-update'];
  const ensureOwnWarnings = function (ctor: typeof UpdatingElement) {
    if (!ctor.hasOwnProperty('enabledWarnings')) {
      ctor.enabledWarnings = ctor.enabledWarnings!.slice();
    }
  };
  UpdatingElement.enableWarning = function (warning: Warnings) {
    ensureOwnWarnings(this);
    if (this.enabledWarnings!.indexOf(warning) < 0) {
      this.enabledWarnings!.push(warning);
    }
  };
  UpdatingElement.disableWarning = function (warning: Warnings) {
    ensureOwnWarnings(this);
    const i = this.enabledWarnings!.indexOf(warning);
    if (i >= 0) {
      this.enabledWarnings!.splice(i, 1);
    }
  };
}
