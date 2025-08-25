import type ts from 'typescript/lib/tsserverlibrary';
import {makeLitLanguageService} from './lib/lit-language-service.js';


const init: ts.server.PluginModuleFactory = ({typescript}) => {
  return {
    create(info: ts.server.PluginCreateInfo) {
      const {logger} = info.project.projectService;

      logger.info(
        `Initializing @lit-labs/tsserver-plugin using ` +
          `typescript ${typescript.version}`
      );

      return makeLitLanguageService(info, typescript);
    },
  };
};

export = init;
