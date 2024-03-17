import {Navigation, TAG_NAME_ROUTER} from './declarations.js';
import {RouterNotFoundError} from './errors.js';

/**
 * Navigates to a new route based on the provided navigation options.
 *
 * @param {Partial<Navigation>} navigation - The navigation options, which can include 'name' or 'path'.
 */
export const navigate = (navigation: Partial<Navigation>) => {
  const router = document.querySelector(TAG_NAME_ROUTER);

  if (!router) {
    throw new RouterNotFoundError();
  }

  router.navigate(navigation);
};

/**
 * Moves forward in the browser's history.
 */
export const forward = () => window.history.forward();

/**
 * Moves backward in the browser's history.
 */
export const back = () => window.history.back();
