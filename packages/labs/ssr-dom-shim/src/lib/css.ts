/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This is a limited implemenation of the CSSStyleSheet class
 * and associated functionality.
 */

type MediaListInterface = MediaList;

const MediaListShim = class MediaList
  extends Array<string>
  implements MediaListInterface
{
  get mediaText(): string {
    return this.join(', ');
  }
  toString(): string {
    return this.mediaText;
  }
  appendMedium(medium: string): void {
    if (!this.includes(medium)) {
      this.push(medium);
    }
  }
  deleteMedium(medium: string): void {
    const index = this.indexOf(medium);
    if (index !== -1) {
      this.splice(index, 1);
    }
  }
  item(index: number): string | null {
    return this[index] ?? null;
  }
};
const MediaListShimWithRealType = MediaListShim as object as typeof MediaList;
export {MediaListShimWithRealType as MediaList};

type StyleSheetInterface = StyleSheet;

const StyleSheetShim = class StyleSheet implements StyleSheetInterface {
  private __media = new MediaListShim();

  disabled: boolean = false;
  get href(): string | null {
    return null;
  }
  get media(): MediaList {
    return this.__media;
  }
  get ownerNode(): Element | ProcessingInstruction | null {
    return null;
  }
  get parentStyleSheet(): CSSStyleSheet | null {
    return null;
  }
  get title(): string | null {
    return null;
  }
  get type(): string {
    return 'text/css';
  }
};

const StyleSheetShimWithRealType =
  StyleSheetShim as object as typeof StyleSheet;
export {StyleSheetShimWithRealType as StyleSheet};

type CSSRuleInterface = CSSRule;

const CSSRuleShim = class CSSRule implements CSSRuleInterface {
  static readonly STYLE_RULE: 1 = 1 as const;
  static readonly CHARSET_RULE: 2 = 2 as const;
  static readonly IMPORT_RULE: 3 = 3 as const;
  static readonly MEDIA_RULE: 4 = 4 as const;
  static readonly FONT_FACE_RULE: 5 = 5 as const;
  static readonly PAGE_RULE: 6 = 6 as const;
  static readonly NAMESPACE_RULE: 10 = 10 as const;
  static readonly KEYFRAMES_RULE: 7 = 7 as const;
  static readonly KEYFRAME_RULE: 8 = 8 as const;
  static readonly SUPPORTS_RULE: 12 = 12 as const;
  static readonly COUNTER_STYLE_RULE: 11 = 11 as const;
  static readonly FONT_FEATURE_VALUES_RULE: 14 = 14 as const;
  readonly STYLE_RULE: 1 = 1 as const;
  readonly CHARSET_RULE: 2 = 2 as const;
  readonly IMPORT_RULE: 3 = 3 as const;
  readonly MEDIA_RULE: 4 = 4 as const;
  readonly FONT_FACE_RULE: 5 = 5 as const;
  readonly PAGE_RULE: 6 = 6 as const;
  readonly NAMESPACE_RULE: 10 = 10 as const;
  readonly KEYFRAMES_RULE: 7 = 7 as const;
  readonly KEYFRAME_RULE: 8 = 8 as const;
  readonly SUPPORTS_RULE: 12 = 12 as const;
  readonly COUNTER_STYLE_RULE: 11 = 11 as const;
  readonly FONT_FEATURE_VALUES_RULE: 14 = 14 as const;
  __parentStyleSheet: CSSStyleSheet | null = null;

  cssText: string = '';
  get parentRule(): CSSRule | null {
    return null;
  }
  get parentStyleSheet(): CSSStyleSheet | null {
    return this.__parentStyleSheet;
  }
  get type(): number {
    return 0;
  }
};

const CSSRuleShimWithRealType = CSSRuleShim as object as typeof CSSRule;
export {CSSRuleShimWithRealType as CSSRule};

type CSSRuleListInterface = CSSRuleList;

const CSSRuleListShim = class CSSRuleList
  extends Array<CSSRule>
  implements CSSRuleListInterface
{
  item(index: number): CSSRule | null {
    return this[index] ?? null;
  }
};

const CSSRuleListShimWithRealType =
  CSSRuleListShim as object as typeof CSSRuleList;
export {CSSRuleListShimWithRealType as CSSRuleList};

type CSSStyleSheetInterface = CSSStyleSheet;

const CSSStyleSheetShim = class CSSStyleSheet
  extends StyleSheetShim
  implements CSSStyleSheetInterface
{
  private __rules = new CSSRuleListShim();
  get cssRules(): CSSRuleList {
    return this.__rules;
  }
  get ownerRule(): CSSRule | null {
    return null;
  }
  get rules(): CSSRuleList {
    return this.cssRules;
  }
  addRule(_selector?: string, _style?: string, _index?: number): number {
    throw new Error('Method not implemented.');
  }
  deleteRule(_index: number): void {
    throw new Error('Method not implemented.');
  }
  insertRule(_rule: string, _index?: number): number {
    throw new Error('Method not implemented.');
  }
  removeRule(_index?: number): void {
    throw new Error('Method not implemented.');
  }
  replace(text: string): Promise<CSSStyleSheet> {
    this.replaceSync(text);
    return Promise.resolve(this);
  }
  replaceSync(text: string): void {
    this.__rules.length = 0;
    const rule = new CSSRuleShim();
    rule.cssText = text;
    this.__rules.push(rule);
  }
};

const CSSStyleSheetShimWithRealType =
  CSSStyleSheetShim as object as typeof CSSStyleSheet;
export {
  CSSStyleSheetShimWithRealType as CSSStyleSheet,
  CSSStyleSheetShimWithRealType as CSSStyleSheetShim,
};
