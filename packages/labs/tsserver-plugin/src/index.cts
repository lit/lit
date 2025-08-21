import type ts from 'typescript/lib/tsserverlibrary';
import {makeLitLanguageService} from './lib/lit-language-service.js';

const litLanguageServiceApplied = Symbol('LitLanguageServiceApplied');

const init: ts.server.PluginModuleFactory = ({typescript}) => {
  return {
    create(info: ts.server.PluginCreateInfo) {
      const {logger} = info.project.projectService;

      // TODO (justinfagnani): Figure out where this logs to or remove.
      console.log('tsserver-plugin create()');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // if ((info.languageService as any)[litLanguageServiceApplied] === true) {
      //   logger.info(
      //     `Skipping double initializing of @lit-labs/tsserver-plugin`
      //   );
      //   return info.languageService;
      // }

      const instance = Object.create(info.languageService);
      instance[litLanguageServiceApplied] = true;

      logger.info(
        `Initializing @lit-labs/tsserver-plugin using ` +
          `typescript ${typescript.version}`
      );
      logger.info(`@lit-labs/tsserver-plugin async time`);

      // const {makeLitLanguageService} = await import(
      //   './lib/lit-language-service.js'
      // );
      makeLitLanguageService(instance, info, typescript);

      // Seems to be a private API
      if ('markAsDirty' in info.project) {
        logger.info(`@lit-labs/tsserver-plugin project.markAsDirty()`);
        (info.project.markAsDirty as Function)();
      } else {
        logger.info(
          `Skipping project.markAsDirty. Not available in this version of TypeScript`
        );
      }
      return instance;
    },
  };
};

export = init;
