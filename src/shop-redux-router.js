import { store } from './shop-redux-store.js';
import { changePath } from './shop-redux-actions.js';

document.body.addEventListener('click', e => {
  if ((e.button !== 0) ||           // Left click only
      (e.metaKey || e.ctrlKey)) {   // No modifiers
    return;
  }
  let origin;
  if (window.location.origin) {
    origin = window.location.origin;
  } else {
    origin = window.location.protocol + '//' + window.location.host;
  }
  let anchor = e.composedPath().filter(n=>n.localName=='a')[0];
  if (anchor && anchor.href.indexOf(origin) === 0) {
    e.preventDefault();
    window.history.pushState({}, '', anchor.href);
    handleUrlChange();
  }
});
const handleUrlChange = () => {
  store.dispatch(changePath(window.decodeURIComponent(window.location.pathname)));
}
window.addEventListener('popstate', _ => handleUrlChange());
handleUrlChange();

export function pushState(href) {
  return dispatch => {
    window.history.pushState({}, '', href);
    dispatch(changePath(window.decodeURIComponent(window.location.pathname)));
  }
}
