/**
 * @TODO
 * - This can be typed better with keyof ARIAMixin, but TypeScript's definition
 * doesn't match what exists in the browsers
 */
export const ariaMixinEnum = {
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
export const initAom = (ref, internals) => {
  for (const _key of Object.keys(ariaMixinEnum)) {
    const key = _key;
    internals[key] = null;
    let closureValue = '';
    const attributeName = ariaMixinEnum[key];
    Object.defineProperty(internals, key, {
      get() {
        return closureValue;
      },
      set(value) {
        closureValue = value;
        if (value) {
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
  constructor(_host) {
    this.ariaAtomic = '';
    this.ariaAutoComplete = '';
    this.ariaBraileLabel = '';
    this.ariaBraileDescription = '';
    this.ariaBusy = '';
    this.ariaChecked = '';
    this.ariaColCount = '';
    this.ariaColIndex = '';
    this.ariaColSpan = '';
    this.ariaCurrent = '';
    this.ariaDescription = '';
    this.ariaDisabled = '';
    this.ariaExpanded = '';
    this.ariaHasPopup = '';
    this.ariaHidden = '';
    this.ariaInvalid = '';
    this.ariaKeyShortcuts = '';
    this.ariaLabel = '';
    this.ariaLevel = '';
    this.ariaLive = '';
    this.ariaModal = '';
    this.ariaMultiLine = '';
    this.ariaMultiSelectable = '';
    this.ariaOrientation = '';
    this.ariaPlaceholder = '';
    this.ariaPosInSet = '';
    this.ariaPressed = '';
    this.ariaReadOnly = '';
    this.ariaRequired = '';
    this.ariaRoleDescription = '';
    this.ariaRowCount = '';
    this.ariaRowIndex = '';
    this.ariaRowSpan = '';
    this.ariaSelected = '';
    this.ariaSetSize = '';
    this.ariaSort = '';
    this.ariaValueMax = '';
    this.ariaValueMin = '';
    this.ariaValueNow = '';
    this.ariaValueText = '';
    this.role = '';
    this.form = null;
    this.labels = [];
    this.states = new Set();
    this.validationMessage = '';
    this.validity = {};
    this.willValidate = true;
    this._host = _host;
    initAom(_host, this);
  }
  get shadowRoot() {
    return this._host.shadowRoot;
  }
  checkValidity() {
    return true;
  }
  reportValidity() {
    return true;
  }
  setFormValue() {}
  setValidity() {}
};
//# sourceMappingURL=InternalsShim.js.map
