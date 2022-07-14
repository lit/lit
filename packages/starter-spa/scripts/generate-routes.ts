import {opendir, writeFile, readFile} from 'fs/promises';
import {Dir} from 'fs';
import {relative} from 'path';

interface Route {
  path: string;
  filePath: string;
}

const generateRouteFileTemplate = (
  routes: string[]
) => `import {RouteConfig} from '@lit-labs/router';
import {registerRoute} from './utils/navigation.js';

export const routes: RouteConfig[] = [
  ${routes.join('\n  ')}
];
`;

const generateRouteRegstration = (route: Route) =>
  `registerRoute('${route.path}', () => import('${route.filePath}')),`;

export const getRoutes = async () => {
  const analyzeDir = async (
    dir: Dir,
    fsBasePath: string,
    routerBasePath = ''
  ): Promise<Route[]> => {
    const routes: Route[] = [];

    for await (const dirent of dir) {
      if (dirent.isFile()) {
        let routerPath = routerBasePath;
        const fileName = dirent.name.replace(/\.ts$/, '.js');

        if (dirent.name === 'index.ts' || dirent.name === 'index.js') {
          routerPath += '/';
        } else {
          routerPath += '/' + fileName.replace(/\.js$/, '');
        }

        const fsPath = './' + relative('./src', `${fsBasePath}/${fileName}`);
        const route = {
          path: routerPath,
          filePath: fsPath,
        };

        console.log(`Processing route: ${JSON.stringify(route)}`);
        routes.push(route);
      } else if (dirent.isDirectory()) {
        const fsPath = `${fsBasePath}/${dirent.name}`;
        const routerPath = `${routerBasePath}/${dirent.name}`;
        routes.push(
          ...(await analyzeDir(await opendir(fsPath), fsPath, routerPath))
        );
      }
    }

    return routes;
  };

  const dir = await opendir('./src/views');

  return await analyzeDir(dir, './src/views');
};

export const checkIncremental = async (routes: Route[]) => {
  const newIncremental = JSON.stringify(routes);
  const incrementalPath = './scripts/.routes-incremental.json';
  try {
    const oldRoutes = await readFile(incrementalPath, 'utf8');
    if (oldRoutes === newIncremental) {
      console.log('No changes detected, skipping incremental write');
      return false;
    }

    return true;
  } catch (e) {
    writeFile(incrementalPath, newIncremental, 'utf8');
    return true;
  }
};

export const generateRouteFile = async (routes: Route[]) => {
  const routeTemplates = routes.map((route) => generateRouteRegstration(route));
  const routeFile = generateRouteFileTemplate(routeTemplates);
  const path = './src/_routes.ts';
  console.log(`Writing route file at: ${path}`);
  writeFile(path, routeFile);
};

const routes = await getRoutes();
const isDiff = await checkIncremental(routes);
if (isDiff) {
  generateRouteFile(routes);
}
