/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {assert} from '@esm-bundle/chai';

import {
  msg,
  configureLocalization,
  configureTransformLocalization,
  LocaleModule,
  LOCALE_STATUS_EVENT,
  LocaleStatusEventDetail,
} from '../lit-localize.js';
import {Localized} from '../localized-element.js';
import {Deferred} from './deferred.js';
import {html, render} from 'lit-html';
import {LitElement} from 'lit-element';

suite('lit-localize', () => {
  let container: HTMLElement;
  let lastLoadLocaleResponse = new Deferred<LocaleModule>();

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(async () => {
    document.body.removeChild(container);
    // Back to the source locale.
    await setLocale('en');
  });

  // We can only call configureLocalization once.
  const {getLocale, setLocale} = configureLocalization({
    sourceLocale: 'en',
    targetLocales: ['es-419'],
    loadLocale: async () => {
      // This lets us easily control the timing of locale module loading from
      // our tests.
      lastLoadLocaleResponse = new Deferred();
      return await lastLoadLocaleResponse.promise;
    },
  });

  const spanishModule = {
    templates: {
      greeting: html`<b>Hola Mundo</b>`,
      parameterized: (name: string) => html`<b>Hola ${name}</b>`,
    },
  };

  suite('basics', () => {
    test('setLocale with invalid locale throws', () => {
      assert.throws(() => {
        setLocale('xxx');
      }, 'Invalid locale code');
    });

    test('calling configureLocalization again throws', () => {
      assert.throws(() => {
        configureLocalization({
          sourceLocale: 'en',
          targetLocales: ['es-419'],
          loadLocale: () => new Promise<LocaleModule>(() => undefined),
        });
      });
    });

    test('calling configureTransformLocalization throws', () => {
      assert.throws(() => {
        configureTransformLocalization({
          sourceLocale: 'en',
        });
      });
    });

    test('renders regular template in English', () => {
      render(msg(html`<b>Hello World</b>`, {id: 'greeting'}), container);
      assert.equal(container.textContent, 'Hello World');
    });

    test('renders regular template in Spanish', async () => {
      const loaded = setLocale('es-419');
      lastLoadLocaleResponse.resolve(spanishModule);
      await loaded;
      render(msg(html`<b>Hello World</b>`, {id: 'greeting'}), container);
      assert.equal(container.textContent, 'Hola Mundo');
    });

    test('renders parameterized template in English', () => {
      render(
        msg((name: string) => html`Hello ${name}`, {
          id: 'parameterized',
          args: ['friend'],
        }),
        container
      );
      assert.equal(container.textContent, 'Hello friend');
    });

    test('renders parameterized template in Spanish', async () => {
      const loaded = setLocale('es-419');
      lastLoadLocaleResponse.resolve(spanishModule);
      await loaded;
      render(
        msg((name: string) => html`Hello ${name}`, {
          id: 'parameterized',
          args: ['friend'],
        }),
        container
      );
      assert.equal(container.textContent, 'Hola friend');
    });
  });

  suite('auto ID', () => {
    const autoSpanishModule = {
      templates: {
        '0s8c0ec8d1fb9e6e32': 'Hola Mundo!',
        '0s00ad08ebae1e0f74': (name: string) => `Hola ${name}!`,
        '0h3c44aff2d5f5ef6b': html`Hola <b>Mundo</b>!`,
        '0h82ccc38d4d46eaa9': (name: string) => html`Hola <b>${name}</b>!`,
      },
    };

    setup(async () => {
      const loaded = setLocale('es-419');
      lastLoadLocaleResponse.resolve(autoSpanishModule);
      await loaded;
    });

    test('renders string template', () => {
      render(msg(`Hello World!`), container);
      assert.equal(container.textContent, 'Hola Mundo!');
    });

    test('renders parameterized string template', () => {
      render(
        msg((name) => `Hello ${name}!`, {args: ['Friend']}),
        container
      );
      assert.equal(container.textContent, 'Hola Friend!');
    });

    test('renders html template', () => {
      render(msg(html`Hello <b>World</b>!`), container);
      assert.equal(container.textContent, 'Hola Mundo!');
    });

    test('renders parameterized html template', () => {
      render(
        msg((name) => html`Hello <b>${name}</b>!`, {args: ['Friend']}),
        container
      );
      assert.equal(container.textContent, 'Hola Friend!');
    });
  });

  suite('Localized mixin', () => {
    class XGreeter extends Localized(LitElement) {
      render() {
        return msg(html`<b>Hello World</b>`, {id: 'greeting'});
      }
    }
    customElements.define('x-greeter', XGreeter);

    test('initially renders in English', async () => {
      const greeter = document.createElement('x-greeter') as XGreeter;
      container.appendChild(greeter);
      await greeter.updateComplete;
      assert.equal(greeter.shadowRoot?.textContent, 'Hello World');
    });

    test('renders in Spanish after locale change', async () => {
      const greeter = document.createElement('x-greeter') as XGreeter;
      container.appendChild(greeter);
      await greeter.updateComplete;

      const loaded = setLocale('es-419');
      lastLoadLocaleResponse.resolve(spanishModule);
      await loaded;
      await greeter.updateComplete;
      assert.equal(greeter.shadowRoot?.textContent, 'Hola Mundo');
    });
  });

  suite('events', () => {
    let eventLog: LocaleStatusEventDetail[] = [];

    setup(() => {
      window.addEventListener(LOCALE_STATUS_EVENT, eventHandler);
    });

    teardown(async () => {
      // Confirm that there were no lingering events.
      await new Promise((resolve) => setTimeout(resolve));
      assertEventLogEqualsAndFlush([]);
      window.removeEventListener(LOCALE_STATUS_EVENT, eventHandler);
    });

    function assertEventLogEqualsAndFlush(expected: LocaleStatusEventDetail[]) {
      try {
        assert.deepEqual(eventLog, expected);
      } catch (e) {
        // Chai gives fairly useless error messages when deep comparing objects.
        console.log('expected: ' + JSON.stringify(expected, null, 4));
        console.log('actual: ' + JSON.stringify(eventLog, null, 4));
        throw e;
      } finally {
        eventLog = [];
      }
    }

    function eventHandler(event: WindowEventMap[typeof LOCALE_STATUS_EVENT]) {
      eventLog.push(event.detail);
    }

    function assertEnglish() {
      assert.equal(getLocale(), 'en');
      render(msg(html`<b>Hello World</b>`, {id: 'greeting'}), container);
      assert.equal(container.textContent, 'Hello World');
    }

    function assertSpanish() {
      assert.equal(getLocale(), 'es-419');
      render(msg(html`<b>Hello World</b>`, {id: 'greeting'}), container);
      assert.equal(container.textContent, 'Hola Mundo');
    }

    test('A -> B', async () => {
      const loaded = setLocale('es-419');
      assertEventLogEqualsAndFlush([
        {
          status: 'loading',
          loadingLocale: 'es-419',
        },
      ]);
      assertEnglish();
      lastLoadLocaleResponse.resolve(spanishModule);
      await loaded;
      assertEventLogEqualsAndFlush([
        {
          status: 'ready',
          readyLocale: 'es-419',
        },
      ]);
      assertSpanish();
    });

    test('A -> A', async () => {
      await setLocale('en');
      assertEventLogEqualsAndFlush([]);
      assertEnglish();
    });

    test('A -> B -> B', async () => {
      const loaded = setLocale('es-419');
      assertEventLogEqualsAndFlush([
        {
          status: 'loading',
          loadingLocale: 'es-419',
        },
      ]);
      assertEnglish();
      lastLoadLocaleResponse.resolve(spanishModule);
      await loaded;
      assertEventLogEqualsAndFlush([
        {
          status: 'ready',
          readyLocale: 'es-419',
        },
      ]);
      assertSpanish();

      await setLocale('es-419');
      assertEventLogEqualsAndFlush([]);
    });

    test('A -> B -> A', async () => {
      const loaded1 = setLocale('es-419');
      assertEventLogEqualsAndFlush([
        {
          status: 'loading',
          loadingLocale: 'es-419',
        },
      ]);
      assertEnglish();
      lastLoadLocaleResponse.resolve(spanishModule);
      await loaded1;
      assertEventLogEqualsAndFlush([
        {
          status: 'ready',
          readyLocale: 'es-419',
        },
      ]);
      assertSpanish();

      const loaded2 = setLocale('en');
      assertEventLogEqualsAndFlush([
        {
          status: 'loading',
          loadingLocale: 'en',
        },
      ]);
      assertSpanish();
      await loaded2;
      assertEventLogEqualsAndFlush([
        {
          status: 'ready',
          readyLocale: 'en',
        },
      ]);
      assertEnglish();
    });

    test('race: A -> B -> A', async () => {
      const spanishLoaded = setLocale('es-419');
      const spanishResponse = lastLoadLocaleResponse;
      assertEventLogEqualsAndFlush([
        {
          status: 'loading',
          loadingLocale: 'es-419',
        },
      ]);
      assertEnglish();

      const englishLoaded = setLocale('en');
      assertEventLogEqualsAndFlush([
        {
          status: 'loading',
          loadingLocale: 'en',
        },
      ]);
      assertEnglish();

      // Resolving the Spanish module after we've switched back to English
      // should be a no-op, because the Spanish request is now stale.
      spanishResponse.resolve(spanishModule);

      // Note both promises resolve.
      await englishLoaded;
      await spanishLoaded;
      assertEventLogEqualsAndFlush([
        {
          status: 'ready',
          readyLocale: 'en',
        },
      ]);
      assertEnglish();
    });

    test('race: A -> B -> A -> B', async () => {
      const spanishLoaded1 = setLocale('es-419');
      const spanishResponse1 = lastLoadLocaleResponse;
      assertEventLogEqualsAndFlush([
        {
          status: 'loading',
          loadingLocale: 'es-419',
        },
      ]);
      assertEnglish();

      const englishLoaded = setLocale('en');
      assertEventLogEqualsAndFlush([
        {
          status: 'loading',
          loadingLocale: 'en',
        },
      ]);
      assertEnglish();

      const spanishLoaded2 = setLocale('es-419');
      const spanishResponse2 = lastLoadLocaleResponse;
      assertEventLogEqualsAndFlush([
        {
          status: 'loading',
          loadingLocale: 'es-419',
        },
      ]);
      assertEnglish();

      // Resolving the first Spanish locale request should be a no-op, even
      // though it's for the same locale code, because that request is now
      // stale.
      spanishResponse1.resolve(spanishModule);
      await new Promise((resolve) => setTimeout(resolve));
      assertEventLogEqualsAndFlush([]);
      assertEnglish();

      // But the second one should work.
      spanishResponse2.resolve(spanishModule);

      // Note all promises resolve.
      await spanishLoaded1;
      await englishLoaded;
      await spanishLoaded2;
      assertEventLogEqualsAndFlush([
        {
          status: 'ready',
          readyLocale: 'es-419',
        },
      ]);
      assertSpanish();
    });

    test('error: A -> B', async () => {
      const spanishLoaded = setLocale('es-419');
      lastLoadLocaleResponse.reject(new Error('Some error'));

      let error;
      try {
        await spanishLoaded;
      } catch (e) {
        error = e;
      }
      assert.isDefined(error);
      assert.equal(error.message, 'Some error');

      assertEventLogEqualsAndFlush([
        {
          status: 'loading',
          loadingLocale: 'es-419',
        },
        {
          status: 'error',
          errorLocale: 'es-419',
          errorMessage: 'Error: Some error',
        },
      ]);
      assertEnglish();
    });
  });
});
