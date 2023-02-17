/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
export interface InternalsHost {
  shadowRoot: ShadowRoot | null;
  setAttribute(key: string, value: unknown): void;
}
/**
 * @TODO
 * - This can be typed better with keyof ARIAMixin, but TypeScript's definition
 * doesn't match what exists in the browsers
 */
export declare const ariaMixinEnum: Record<string, string>;
/** Force the attributes onto the reference element based on internals properties */
export declare const initAom: (
  ref: InternalsHost,
  internals: ElementInternals
) => void;
export declare const InternalsShim: {
  new (_host: InternalsHost): {
    ariaAtomic: string;
    ariaAutoComplete: string;
    ariaBraileLabel: string;
    ariaBraileDescription: string;
    ariaBusy: string;
    ariaChecked: string;
    ariaColCount: string;
    ariaColIndex: string;
    ariaColSpan: string;
    ariaCurrent: string;
    ariaDescription: string;
    ariaDisabled: string;
    ariaExpanded: string;
    ariaHasPopup: string;
    ariaHidden: string;
    ariaInvalid: string;
    ariaKeyShortcuts: string;
    ariaLabel: string;
    ariaLevel: string;
    ariaLive: string;
    ariaModal: string;
    ariaMultiLine: string;
    ariaMultiSelectable: string;
    ariaOrientation: string;
    ariaPlaceholder: string;
    ariaPosInSet: string;
    ariaPressed: string;
    ariaReadOnly: string;
    ariaRequired: string;
    ariaRoleDescription: string;
    ariaRowCount: string;
    ariaRowIndex: string;
    ariaRowSpan: string;
    ariaSelected: string;
    ariaSetSize: string;
    ariaSort: string;
    ariaValueMax: string;
    ariaValueMin: string;
    ariaValueNow: string;
    ariaValueText: string;
    role: string;
    _host: InternalsHost;
    readonly shadowRoot: ShadowRoot | null;
    checkValidity(): boolean;
    form: null;
    labels: NodeListOf<HTMLLabelElement>;
    reportValidity(): boolean;
    setFormValue(): void;
    setValidity(): void;
    states: Set<unknown>;
    validationMessage: string;
    validity: ValidityState;
    willValidate: boolean;
  };
};
//# sourceMappingURL=InternalsShim.d.ts.map
