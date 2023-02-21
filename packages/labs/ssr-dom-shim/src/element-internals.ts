/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * TODO
 * - Potentially remove the keys that don't formally exist in AriaMixin, waiting for review consensus
 */
export const ariaMixinEnum: Record<keyof ARIAMixin, string> = {
  ariaAtomic: 'aria-atomic',
  ariaAutoComplete: 'aria-autocomplete',
  // ariaBraileLabel: 'aria-brailelabel',
  // ariaBraileDescription: 'aria-brailedescription',
  ariaBusy: 'aria-busy',
  ariaChecked: 'aria-checked',
  ariaColCount: 'aria-colcount',
  ariaColIndex: 'aria-colindex',
  ariaColSpan: 'aria-colspan',
  ariaCurrent: 'aria-current',
  // ariaDescription: 'aria-description',
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

/**
 * Reflect internals AOM attributes back to the DOM prior to hydration
 * to ensure search bots can accurately parse element semantics prior
 * to hydration. This is called whenever an instance of ElementInternals
 * is created on an element to wire up the getters/setters
 * for the AriaMixin properties
 *
 * TODO - Determine the proper way to hydrate any attributes set by the shim
 * and remove these when the element is fully rendered
 */
export const initAom = (ref: HTMLElement, internals: ElementInternals) => {
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
  __host: HTMLElement;
  get shadowRoot() {
    // Grab the shadow root instance from the Element shim
    // to ensure that the shadow root is always available
    // to the internals instance even if the mode is 'closed'
    return (this.__host as HTMLElement & {__shadowRoot: ShadowRoot})
      .__shadowRoot;
  }
  constructor(_host: HTMLElement) {
    this.__host = _host;

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
