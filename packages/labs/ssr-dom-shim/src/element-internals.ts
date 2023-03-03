/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * TODO
 * - This type could be better inferred as Record<keyof ARIAMixin, string>;
 *   however, modern browsers and TypeScript seem to lack a common
 *   definition of the keys listed in ARIAMixin
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

// Shim the global element internals object
// Methods should be fine as noops and properties can generally
// be while on the server.
export const InternalsShim = class ElementInternals implements ARIAMixin {
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
