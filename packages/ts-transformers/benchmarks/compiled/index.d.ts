/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {LitElement} from 'lit';
declare type SimpleItem = {
  [index: string]: string;
};
export declare class XThing extends LitElement {
  static styles: import('lit').CSSResult;
  from: string;
  time: string;
  subject: string;
  protected render(): import('lit').TemplateResult<1>;
}
export declare class XItem extends LitElement {
  static styles: import('lit').CSSResult;
  item: SimpleItem;
  protected render(): import('lit').TemplateResult<1>;
  onClick(e: MouseEvent): void;
}
export declare class XApp extends LitElement {
  items: SimpleItem[];
  protected render(): import('lit').TemplateResult<1>;
}
export {};
