import {LitRouter} from './lit-router.js';

export const TAG_NAME_ROUTER = 'lit-router' as const;

export type HTMLElementConstructor = typeof HTMLElement;

export type Component =
  | string
  | HTMLElementConstructor
  | (() => Promise<HTMLElementConstructor>);

export type BaseRouter = Pick<
  LitRouter,
  | 'routes'
  | 'qs'
  | 'params'
  | 'onChange'
  | 'setRoutes'
  | 'navigate'
  | 'forward'
  | 'back'
>;

export type CustomRouterGuard = Omit<
  BaseRouter,
  'onChange' | 'setRoutes' | 'routes'
>;

export type Guard = (router: CustomRouterGuard) => boolean | Promise<boolean>;

export interface Suscription {
  /**
   * Unsubscribe the suscription.
   */
  unsubscribe: () => void;
}

export interface Navigation {
  /**
   * Navigation path.
   */
  path: string;
  /**
   * Href associated with the navigation path.
   */
  href: string;
  /**
   * Query associated with the navigation path in the form of key-value pairs.
   */
  query: Record<string, string>;
}

export interface NavigationOptions {
  /**
   * Indicates whether 'window.history.pushState' should be enabled.
   */
  enableHistoryPushState: boolean;
}
