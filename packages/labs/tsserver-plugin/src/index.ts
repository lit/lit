/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript/lib/tsserverlibrary.js';

function init(_modules: {
  typescript: typeof import('typescript/lib/tsserverlibrary');
}) {
  function create(info: ts.server.PluginCreateInfo) {
    // Get a list of things to remove from the completion list from the config object.
    // If nothing was specified, we'll just remove 'caller'
    const whatToChange: string[] = info.config.remove || ['kevin'];

    // Diagnostic logging
    info.project.projectService.logger.info(
      "I'm getting set up now! Check the log for this message."
    );

    // Set up decorator object
    const proxy: ts.LanguageService = Object.create(null);
    for (const k of Object.keys(info.languageService) as Array<
      keyof ts.LanguageService
    >) {
      const x = info.languageService[k]!;
      // @ts-expect-error - JS runtime trickery which is tricky to type tersely
      proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
    }

    // Remove specified entries from completion list
    proxy.getCompletionsAtPosition = (fileName, position, options) => {
      // This is just to let you hook into something to
      // see the debugger working
      // debugger;

      const prior = info.languageService.getCompletionsAtPosition(
        fileName,
        position,
        options
      );
      if (!prior) return;

      let entriesChanged = 0;
      prior.entries = prior.entries.map((e) =>
        whatToChange.indexOf(e.name) < 0
          ? e
          : (entriesChanged++, {...e, name: `${e.name}-updated!`})
      );

      // Sample logging for diagnostic purposes
      if (entriesChanged) {
        info.project.projectService.logger.info(
          `Changed ${entriesChanged} entries from the completion list`
        );
        info.project.projectService.logger.info(
          `Program info:
\trootFileNames: ${info.languageService.getProgram()?.getRootFileNames()}
\tconfigFile: ${
            info.languageService.getProgram()?.getCompilerOptions()
              .configFilePath
          }
`
        );
      }

      return prior;
    };

    return proxy;
  }

  return {create};
}

export = init;
