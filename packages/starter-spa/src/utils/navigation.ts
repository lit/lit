import {RouteConfig} from '@lit-labs/router';
import {TemplateResult} from 'lit';

export const goto = (url: string) => {
  window.history.pushState({}, '', url);
};

type RenderFn = (params: unknown) => TemplateResult;
export type ModuleOrRenderFn = () => RenderFn | Promise<{default: RenderFn}>;

export const registerRoute = (
  path: string,
  moduleOrRenderFn: ModuleOrRenderFn
): RouteConfig => {
  let render: RenderFn;
  return {
    path: path,
    enter: async () => {
      const modOrRender = await moduleOrRenderFn();
      if (typeof modOrRender === 'function') {
        render = modOrRender;
      } else {
        render = modOrRender.default;
      }
      return true;
    },
    render: (params) => render(params),
  };
};
