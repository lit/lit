declare class URLPattern {
  constructor(init: URLPatternInit | string, baseURL?: string);
  test(input: string | URLPatternInit, baseURL?: string): boolean;
  exec(
    input: string | URLPatternInit,
    baseURL?: string
  ): URLPatternResult | null | undefined;
  public get protocol(): string;
  public get username(): string;
  public get password(): string;
  public get hostname(): string;
  public get port(): string;
  public get pathname(): string;
  public get search(): string;
  public get hash(): string;
}
interface URLPatternInit {
  baseURL?: string;
  username?: string;
  password?: string;
  protocol?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
}
type URLPatternKeys = keyof URLPatternInit;
interface URLPatternResult {
  inputs: [URLPatternInit | string];
  protocol: URLPatternComponentResult;
  username: URLPatternComponentResult;
  password: URLPatternComponentResult;
  hostname: URLPatternComponentResult;
  port: URLPatternComponentResult;
  pathname: URLPatternComponentResult;
  search: URLPatternComponentResult;
  hash: URLPatternComponentResult;
}
interface URLPatternComponentResult {
  input: string;
  groups: {[key: string]: string};
}
