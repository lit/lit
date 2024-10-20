import type ts from 'typescript/lib/tsserverlibrary';
import {LitLanguageService} from './lib/lit-language-service.js';

const init: ts.server.PluginModuleFactory = ({typescript}) => {
  return {
    create(info: ts.server.PluginCreateInfo) {
      const {logger} = info.project.projectService;

      if (LitLanguageService.isLitLanguageService(info.languageService)) {
        logger.info(
          `Skipping double initializing of @lit-labs/tsserver-plugin`
        );
        return info.languageService;
      }

      logger.info(
        `Initializing @lit-labs/tsserver-plugin using ` +
          `typescript ${typescript.version}`
      );
      return new LitLanguageService(info, typescript);
    },
  };
};

export = init;
