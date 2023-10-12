import {Html, Head, Main, NextScript} from 'next/document';
import Script from 'next/script';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <Script
          id="template-shadowroot"
          type="module"
          strategy="beforeInteractive"
        >{`
          if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode')) {
            const {hydrateShadowRoots} = await import('https://unpkg.com/@webcomponents/template-shadowroot@0.2.1/template-shadowroot.js');
            hydrateShadowRoots(document.body);
          }
        `}</Script>
        <NextScript />
      </body>
    </Html>
  );
}
