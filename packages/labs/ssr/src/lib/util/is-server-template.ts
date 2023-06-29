import {CompiledTemplateResult, TemplateResult} from 'lit-html';

// DO NOT SUBMIT without finding a better place for this stuff
export const SERVER_ONLY = 1;
export const SERVER_DOCUMENT_ONLY = 2;
export const NORMAL = 0;

type MaybeCompiledTemplate = TemplateResult | CompiledTemplateResult;

type MaybeServerTemplate = MaybeCompiledTemplate & {
  $_litServerRenderMode?: typeof SERVER_ONLY | typeof SERVER_DOCUMENT_ONLY;
};

type TemplateType =
  | typeof NORMAL
  | typeof SERVER_ONLY
  | typeof SERVER_DOCUMENT_ONLY;
export const getServerTemplateType = (
  template: MaybeServerTemplate
): TemplateType => {
  return template.$_litServerRenderMode ?? NORMAL;
};

export const isHydratable = (template: MaybeServerTemplate): boolean => {
  return getServerTemplateType(template) === NORMAL;
};
