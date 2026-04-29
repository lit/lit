/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

type StringKeys<T extends object> = {
  [K in keyof T]: T[K] extends string | null ? K : never;
}[keyof T];

// Since TypeScript 5.9, ARIAMixin has properties with the type Element | null
// or Element[] | null. However, we can only support string attributes,
// which is why we filter for string properties.
type ARIAAttributeMap = {
  [K in StringKeys<ARIAMixin>]: string;
};

/**
 * Map of ARIAMixin properties to attributes
 */
export const ariaMixinAttributes: ARIAAttributeMap = {
  ariaAtomic: 'aria-atomic',
  ariaAutoComplete: 'aria-autocomplete',
  ariaBrailleLabel: 'aria-braillelabel',
  ariaBrailleRoleDescription: 'aria-brailleroledescription',
  ariaBusy: 'aria-busy',
  ariaChecked: 'aria-checked',
  ariaColCount: 'aria-colcount',
  ariaColIndex: 'aria-colindex',
  ariaColIndexText: 'aria-colindextext',
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
  ariaRelevant: 'aria-relevant',
  ariaRequired: 'aria-required',
  ariaRoleDescription: 'aria-roledescription',
  ariaRowCount: 'aria-rowcount',
  ariaRowIndex: 'aria-rowindex',
  ariaRowIndexText: 'aria-rowindextext',
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

type ElementInternalsInterface = ElementInternals;

// Shim the global element internals object
// Methods should be fine as noops and properties can generally
// be while on the server.
export const ElementInternalsShim = class ElementInternals
  implements ElementInternalsInterface
{
  ariaActiveDescendantElement = null;
  ariaAtomic = '';
  ariaAutoComplete = '';
  ariaBrailleLabel = '';
  ariaBrailleRoleDescription = '';
  ariaBusy = '';
  ariaChecked = '';
  ariaColCount = '';
  ariaColIndex = '';
  ariaColIndexText = '';
  ariaColSpan = '';
  ariaControlsElements = null;
  ariaCurrent = '';
  ariaDescribedByElements = null;
  ariaDescription = '';
  ariaDetailsElements = null;
  ariaDisabled = '';
  ariaErrorMessageElements = null;
  ariaExpanded = '';
  ariaFlowToElements = null;
  ariaHasPopup = '';
  ariaHidden = '';
  ariaInvalid = '';
  ariaKeyShortcuts = '';
  ariaLabel = '';
  ariaLabelledByElements = null;
  ariaLevel = '';
  ariaLive = '';
  ariaModal = '';
  ariaMultiLine = '';
  ariaMultiSelectable = '';
  ariaOrientation = '';
  ariaOwnsElements = null;
  ariaPlaceholder = '';
  ariaPosInSet = '';
  ariaPressed = '';
  ariaReadOnly = '';
  ariaRelevant = '';
  ariaRequired = '';
  ariaRoleDescription = '';
  ariaRowCount = '';
  ariaRowIndex = '';
  ariaRowIndexText = '';
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
  }
  checkValidity() {
    // TODO(augustjk) Consider actually implementing logic.
    // See https://github.com/lit/lit/issues/3740
    console.warn(
      '`ElementInternals.checkValidity()` was called on the server.' +
        'This method always returns true.'
    );
    return true;
  }
  form = null;
  labels = [] as unknown as NodeListOf<HTMLLabelElement>;
  reportValidity() {
    return true;
  }
  setFormValue(): void {}
  setValidity(): void {}
  states = new Set<string>();
  validationMessage = '';
  validity = {} as ValidityState;
  willValidate = true;
};

const ElementInternalsShimWithRealType =
  ElementInternalsShim as object as typeof ElementInternals;
export {ElementInternalsShimWithRealType as ElementInternals};

export const HYDRATE_INTERNALS_ATTR_PREFIX = 'hydrate-internals-';
