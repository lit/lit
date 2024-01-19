import type ts from 'typescript/lib/tsserverlibrary';

const init = (modules: {typescript: typeof ts}) => {
  const ts = modules.typescript;

  const create = (info: ts.server.PluginCreateInfo) => {
    info.project.projectService.logger.info(
      `Initializing @lit-labs/tsserver-plugin using typescript ${ts.version}`
    );

    // Set up decorator object
    // This is an object that wraps the previous languageService and adds our
    // service's functionality on top
    // See https://github.com/microsoft/TypeScript/wiki/Writing-a-Language-Service-Plugin#decorator-creation

    // TODO (justinfagnani): the property copying below is creaky and assumes
    // everything is a method. Can we use prototypal inheritance or a real
    // Proxy instead?
    const proxy: ts.LanguageService = Object.create(null);

    for (const k of Object.keys(info.languageService) as Array<
      keyof ts.LanguageService
    >) {
      const x = info.languageService[k]!;
      // @ts-expect-error - JS runtime trickery which is tricky to type tersely
      proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
    }

    return proxy;
  };

  return {create};
};

export default init;
