import {pathToFileURL} from 'url';
import {join} from 'path';
import type {ThunkedRenderResult} from '../render-result.js';

type ImportCallback = (
  specifier: string,
  callback: (error: string | null) => void
) => void;

export const shadowRealmRenders = new WeakMap<
  ShadowRealm,
  (value: string) => ThunkedRenderResult
>();

export async function createShadowRealm(options?: {
  modules?: string[];
}): Promise<ShadowRealm> {
  const modules = options?.modules ?? [];

  const shadowRealm = new ShadowRealm();

  const importModuleCallback = shadowRealm.evaluate<ImportCallback>(`
      (specifier, callback) => {
        import(specifier).then(
          () => callback(null),
          (error) => callback(String(error))
        );
      }
    `);
  const importModule = (specifier: string) =>
    new Promise<void>((resolve, reject) => {
      const resolvedSpecifier = specifier.startsWith('.')
        ? pathToFileURL(join(process.cwd(), specifier)).href
        : specifier;
      importModuleCallback(resolvedSpecifier, (error) => {
        if (error) {
          reject(
            new Error(
              `Error importing module ${specifier} into ShadowRealm: ${error}`
            )
          );
        } else {
          resolve();
        }
      });
    });

  await importModule(new URL('./dom-shim.js', import.meta.url).href);

  const renderThunked = (await shadowRealm.importValue(
    new URL('./render-internal.js', import.meta.url).href,
    'renderThunkedInShadowRealm'
  )) as unknown as (value: string) => ThunkedRenderResult;

  shadowRealmRenders.set(shadowRealm, renderThunked);

  for (const specifier of modules) {
    await importModule(specifier);
  }

  return shadowRealm;
}
