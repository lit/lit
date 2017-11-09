import { updateLocation } from './actions/location.js';

export function installLocation(store) {
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

  function handleUrlChange() {
    store.dispatch(updateLocation(window.decodeURIComponent(window.location.pathname)));
  }
  window.addEventListener('popstate', handleUrlChange);
  handleUrlChange();
}
