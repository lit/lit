import cors from 'koa-cors';
import Koa from 'koa';
import type {AbsolutePath, Analyzer} from '@lit-labs/analyzer';
import {bareSpecifierTransformer} from './bare-specifier-transformer.js';
import type ts from 'typescript';
import {getModulePathFromJsPath} from './paths.js';
import * as path from 'path';

const baseUrl = '/_src/';
const jsBaseUrl = '/_js/';

export const startServer = async (analyzer: Analyzer, port: number = 3334) => {
  const app = new Koa();
  app.use(cors({origin: '*', credentials: true}));
  app.use(async (context) => {
    if (context.path.startsWith(baseUrl)) {
      // TODO: caching!
      const jsPath = context.path.slice(baseUrl.length - 1) as AbsolutePath;
      const modulePath = getModulePathFromJsPath(analyzer, jsPath);

      if (modulePath) {
        const sourceFile = analyzer.program.getSourceFile(modulePath);
        const result = analyzer.typescript.transform(sourceFile!, [
          bareSpecifierTransformer(analyzer, baseUrl),
        ]);

        const printer = analyzer.typescript.createPrinter();

        const transformedFile = result.transformed[0];

        // console.log(
        //   'result',
        //   printer.printFile(transformedFile).substring(0, 1000)
        // );

        const emittedFiles: Array<{fileName: string; text: string}> = [];

        const emitResult = analyzer.program.emit(
          sourceFile,
          (fileName: string, text: string) => {
            emittedFiles.push({fileName, text});
          },
          undefined,
          false,
          {
            after: [bareSpecifierTransformer(analyzer, baseUrl)],
          }
        );
        // console.log('emittedFiles', emittedFiles);
        const jsFile = emittedFiles.filter((f) =>
          f.fileName.endsWith('.js')
        )[0];
        const jsOutput = jsFile?.text;
        // const jsOutput = printer.printFile(transformedFile);

        context.body = jsOutput;
        context.type = 'text/javascript';
        return;
      } else {
        // File is not part of the program, likely a dependency
        const pkg = analyzer.getPackage();
        const root = pkg.rootDir;
        const modulePath = path.resolve(root, '.' + jsPath);
        const source = await analyzer.fs.readFile(modulePath, 'utf-8')!;
        const result = analyzer.typescript.transpileModule(source, {
          fileName: modulePath,
          compilerOptions: {
            module: analyzer.typescript.ModuleKind.ESNext,
            target: analyzer.typescript.ScriptTarget.ESNext,
          },
          transformers: {
            after: [bareSpecifierTransformer(analyzer, baseUrl)],
          },
        });
        context.body = result.outputText;
        context.type = 'text/javascript';
        return;
      }
    }
    context.body = 'Hello World';
  });
  const server = app.listen(port);
  console.log(server.address());
  return server;
};
