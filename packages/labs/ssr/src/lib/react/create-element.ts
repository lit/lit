import { renderElementSync } from '../render-global.js';
import { createComponent } from './create-component.js';
import { hydrateShadowRoots } from '@webcomponents/template-shadowroot';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (process.env.NODE_ENV !== 'production' && (process as any).browser) {
  const define = CustomElementRegistry.prototype.define;
  CustomElementRegistry.prototype.define = function(tagName: string, ceClass: typeof HTMLElement) {
    if (customElements.get(tagName)) {
      console.info(`Custom Element definition for ${tagName} changed; reloading page.`);
      window.location.reload();
    } else {
      define.call(this, tagName, ceClass);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isCustomElement = (tagName: any) =>
  typeof tagName === 'string' && customElements.get(tagName);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentMap: Map<string, any> = new Map();

const attributesToProps = (attrs: NamedNodeMap) => {
  const props: {[index: string]: string} = {};
  for (let i=0; i<attrs.length; i++) {
    const attr = attrs[i];
    props[attr.name] = attr.value;
  }
  return props;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const enhanceCreateElement = (baseCreateElement: any, Component: any) => {
  let createElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((process as any).browser) {
    createElement = (type: string, props: {}, ...children: {}[]) => {
      if (isCustomElement(type)) {
        const tagName = type;
        type = componentMap.get(type);
        if (type === undefined) {
          componentMap.set(tagName, (type = createComponent(baseCreateElement, Component, tagName)));
        }
        props = {
          ...props,
          'defer-hydration': '',
          suppressHydrationWarning: true
        };
      }
      return baseCreateElement(type, props, ...children);
    }
    window.addEventListener('DOMContentLoaded', () => {
      hydrateShadowRoots(document.body);
    });
  } else {
    createElement = (type: string, props: {}, ...children: {}[]) => {
      if (typeof type === 'string' && type.indexOf('-') > 0) {
        const element = renderElementSync(type, {propertiesOrAttributes: props});
        if (element !== undefined) {
          const shadowRoot = baseCreateElement('template', {
            shadowroot: 'open',
            dangerouslySetInnerHTML: {
              __html: element.shadowRoot
            }
          });
          return baseCreateElement(type, {
            children: [shadowRoot, ...children],
            'defer-hydration': '',
            ...attributesToProps(element.attributes)
          });
        }
      }
      return baseCreateElement(type, props, ...children);
    };
  }
  return createElement;
}