interface ShadyCSS {
  nativeCss: boolean;
  nativeShadow: boolean;
  styleElement(host: Element, overrideProps?: { [key: string]: string }): void;
  prepareTemplateDom(template: Element, elementName: string): void;
  prepareTemplateStyles(
    template: Element,
    elementName: string,
    typeExtension?: string
  ): void;
  ScopingShim:
    | undefined
    | {
        prepareAdoptedCssText(
          cssTextArray: string[],
          elementName: string
        ): void;
      };
}

interface ShadyDOM {
  inUse: boolean;
  noPatch: boolean | string;
  wrap: (node: Node) => Node;
}

interface Window {
  ShadyCSS?: ShadyCSS;
  ShadyDOM?: ShadyDOM;
}
