interface ShadyCSS {
  nativeCss: boolean;
  nativeShadow: boolean;
  styleElement(host: Element, overrideProps?: {[key: string]: string}): void;
  prepareTemplateDom(template: Element, elementName: string): void;
  prepareTemplateStyles(
      template: Element, elementName: string, typeExtension?: string): void;
}

interface ShadyDOM {
  inUse: boolean;
}

interface Window {
  ShadyCSS?: ShadyCSS;
  ShadyDOM?: ShadyDOM;
}

/** Allows code to check `instanceof ShadowRoot`. */
declare interface ShadowRootConstructor {
  new(): ShadowRoot;
}
declare const ShadowRoot: ShadowRootConstructor;
