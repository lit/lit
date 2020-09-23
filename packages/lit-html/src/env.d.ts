interface ShadyCSS {
  nativeCss: boolean;
  nativeShadow: boolean;
  styleElement(host: Element, overrideProps?: {[key: string]: string}): void;
  ScopingShim:
    | undefined
    | {
        prepareTemplateDom(template: Element, elementName: string): void;
        prepareAdoptedCssText(
          cssTextArray: string[],
          elementName: string
        ): void;
        prepareTemplateStyles(template: Element, elementName: string): void;
      };
}

interface ShadyDOM {
  inUse: boolean;
}

interface Window {
  ShadyCSS?: ShadyCSS;
  ShadyDOM?: ShadyDOM;
}
