declare module 'rollup-pluginutils' {
  export function createFilter(
    include?: string | string[],
    exclude?: string | string[]
  ): (id: string) => boolean;
}
