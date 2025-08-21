import type ts from 'typescript/lib/tsserverlibrary';
import {makeLitLanguageService} from './lib/lit-language-service.js';

const init: ts.server.PluginModuleFactory = ({typescript}) => {
  return {
    create(info: ts.server.PluginCreateInfo) {
      const {logger} = info.project.projectService;

      const instance = Object.create(info.languageService);

      logger.info(
        `Initializing @lit-labs/tsserver-plugin using ` +
          `typescript ${typescript.version}`
      );
      logger.info(`@lit-labs/tsserver-plugin async time`);

      makeLitLanguageService(instance, info, typescript);

      return instance;
    },
  };
};

export = init;
