interface ShadyCSS {
  nativeCss: boolean;
  nativeShadow: boolean;
  ScopingShim: undefined|{
    prepareTemplateDom(template: Element, elementName: string): void;
    prepareAdoptedCssText(cssTextArray: string[], elementName: string): void;
    prepareTemplate(template: Element, elementName: string): void;
  };
}

interface ShadyDOM {
  inUse: boolean;
}

interface Window {
  ShadyCSS?: ShadyCSS;
  ShadyDOM?: ShadyDOM;
}