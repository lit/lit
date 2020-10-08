interface ShadyCSS {
  nativeCss: boolean;
  nativeShadow: boolean;
  styleElement(host: Element, overrideProps?: {[key: string]: string}): void;
  styleSubtree(host: Element, overrideProps?: {[key: string]: string}): void;
  getComputedStyleValue(element: Element, property: string): string;
  ApplyShim: object;
  prepareTemplateDom(template: Element, elementName: string): void;
  prepareTemplateStyles(template: Element, elementName: string): void;
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
  flush: () => void;
}

interface Window {
  ShadyCSS?: ShadyCSS;
  ShadyDOM?: ShadyDOM;
  ShadowRoot: typeof ShadowRoot;
  litElementPlatformSupport: (options: {[index: string]: any}) => void;
  litHtmlPlatformSupport: (options: {[index: string]: any}) => void;
}

// Augment existing types with styling API
interface ShadowRoot {
  adoptedStyleSheets: CSSStyleSheet[];
}

// eslint-disable-next-line no-var
declare var ShadowRoot: {prototype: ShadowRoot; new (): ShadowRoot};

interface CSSStyleSheet {
  replaceSync(cssText: string): void;
  replace(cssText: string): Promise<unknown>;
}
