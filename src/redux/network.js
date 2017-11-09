import { updateNetworkStatus } from './actions/network.js';

export function installNetwork(store) {
  function handleNetworkChange() {
    store.dispatch(updateNetworkStatus(navigator.onLine));
  }
  window.addEventListener('online', handleNetworkChange);
  window.addEventListener('offline', handleNetworkChange);
  handleNetworkChange();
}
