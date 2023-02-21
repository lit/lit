/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
export interface InternalsHost {
  hasAttribute(name: string): boolean;
  shadowRoot: ShadowRoot | null;
  setAttribute(key: string, value: unknown): void;
}

/**
 * @TODO
 * - This can be typed better with keyof ARIAMixin, but TypeScript's definition
 * doesn't match what exists in the browsers
 */
export const ariaMixinEnum: Record<string, string> = {
  ariaAtomic: 'aria-atomic',
  ariaAutoComplete: 'aria-autocomplete',
  ariaBraileLabel: 'aria-brailelabel',
  ariaBraileDescription: 'aria-brailedescription',
  ariaBusy: 'aria-busy',
  ariaChecked: 'aria-checked',
  ariaColCount: 'aria-colcount',
  ariaColIndex: 'aria-colindex',
  ariaColSpan: 'aria-colspan',
  ariaCurrent: 'aria-current',
  ariaDescription: 'aria-description',
  ariaDisabled: 'aria-disabled',
  ariaExpanded: 'aria-expanded',
  ariaHasPopup: 'aria-haspopup',
  ariaHidden: 'aria-hidden',
  ariaInvalid: 'aria-invalid',
  ariaKeyShortcuts: 'aria-keyshortcuts',
  ariaLabel: 'aria-label',
  ariaLevel: 'aria-level',
  ariaLive: 'aria-live',
  ariaModal: 'aria-modal',
  ariaMultiLine: 'aria-multiline',
  ariaMultiSelectable: 'aria-multiselectable',
  ariaOrientation: 'aria-orientation',
  ariaPlaceholder: 'aria-placeholder',
  ariaPosInSet: 'aria-posinset',
  ariaPressed: 'aria-pressed',
  ariaReadOnly: 'aria-readonly',
  ariaRequired: 'aria-required',
  ariaRoleDescription: 'aria-roledescription',
  ariaRowCount: 'aria-rowcount',
  ariaRowIndex: 'aria-rowindex',
  ariaRowSpan: 'aria-rowspan',
  ariaSelected: 'aria-selected',
  ariaSetSize: 'aria-setsize',
  ariaSort: 'aria-sort',
  ariaValueMax: 'aria-valuemax',
  ariaValueMin: 'aria-valuemin',
  ariaValueNow: 'aria-valuenow',
  ariaValueText: 'aria-valuetext',
  role: 'role',
};

/** Force the attributes onto the reference element based on internals properties */
export const initAom = (ref: InternalsHost, internals: ElementInternals) => {
  for (const _key of Object.keys(ariaMixinEnum)) {
    const key = _key as keyof ARIAMixin;
    internals[key] = null;

    let closureValue = '';
    const attributeName = ariaMixinEnum[key];
    Object.defineProperty(internals, key, {
      get() {
        return closureValue;
      },
      set(value) {
        closureValue = value;
        /**
         * The internals semantics will favor any attribute already set
         * on the host element over the internals property
         */
        if (value && !ref.hasAttribute(attributeName)) {
          ref.setAttribute(attributeName, value);
        }
      },
    });
  }
};

// Shim the global element internals object
// Methods should be fine as noops and properties can generally
// be while on the server.
export const InternalsShim = class ElementInternals {
  ariaAtomic = '';
  ariaAutoComplete = '';
  ariaBraileLabel = '';
  ariaBraileDescription = '';
  ariaBusy = '';
  ariaChecked = '';
  ariaColCount = '';
  ariaColIndex = '';
  ariaColSpan = '';
  ariaCurrent = '';
  ariaDescription = '';
  ariaDisabled = '';
  ariaExpanded = '';
  ariaHasPopup = '';
  ariaHidden = '';
  ariaInvalid = '';
  ariaKeyShortcuts = '';
  ariaLabel = '';
  ariaLevel = '';
  ariaLive = '';
  ariaModal = '';
  ariaMultiLine = '';
  ariaMultiSelectable = '';
  ariaOrientation = '';
  ariaPlaceholder = '';
  ariaPosInSet = '';
  ariaPressed = '';
  ariaReadOnly = '';
  ariaRequired = '';
  ariaRoleDescription = '';
  ariaRowCount = '';
  ariaRowIndex = '';
  ariaRowSpan = '';
  ariaSelected = '';
  ariaSetSize = '';
  ariaSort = '';
  ariaValueMax = '';
  ariaValueMin = '';
  ariaValueNow = '';
  ariaValueText = '';
  role = '';
  _host: InternalsHost;
  get shadowRoot() {
    return this._host.shadowRoot;
  }
  constructor(_host: InternalsHost) {
    this._host = _host;

    initAom(_host, this);
  }
  checkValidity() {
    return true;
  }
  form = null;
  labels = [] as unknown as NodeListOf<HTMLLabelElement>;
  reportValidity() {
    return true;
  }
  setFormValue(): void {}
  setValidity(): void {}
  states = new Set();
  validationMessage = '';
  validity = {} as globalThis.ValidityState;
  willValidate = true;
};
