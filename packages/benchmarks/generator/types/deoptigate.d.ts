declare module 'deoptigate/app/lib/create-page.js' {
  export function createPage(): string;
}
declare module 'deoptigate/deoptigate.log.js' {
  export function logToJSON(path: string, options: { root: string}): Promise<string>;
}
