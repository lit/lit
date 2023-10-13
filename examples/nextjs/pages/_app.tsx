import '../styles/globals.css';
import type {AppProps} from 'next/app';
import {isServer} from 'lit';
// Might be possible to dynamically import this inside the condition below but
// will need top-level await
import {hydrateShadowRoots} from '@webcomponents/template-shadowroot';

if (!isServer) {
  if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMote')) {
    hydrateShadowRoots(document.body);
  }
}

export default function App({Component, pageProps}: AppProps) {
  return <Component {...pageProps} />;
}
