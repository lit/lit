/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from '@open-wc/testing';

import {render} from 'lit';
import {hydrate} from '@lit-labs/ssr-client';
import {hydrateShadowRoots} from '@webcomponents/template-shadowroot/template-shadowroot.js';
import {
  SSRExpectedHTML,
  SSRExpectedHTMLGroup,
  SSRTestSuite,
  isAnyHtml,
} from '../tests/ssr-test.js';

const assertTemplate = document.createElement('template');

// For now, don't run SSR tests on IE
const skipSSRTests = window.navigator.userAgent.indexOf('Trident/') >= 0;

/**
 * Removes comments, normalizes text content, and normalizes style attribute
 * serialization.
 *
 * Although semantic-dom-diff removes comments, it does not normalize
 * textContent after removing them, so differences in comments remain
 * semantically meaningful; we currently use different comment marker strategies
 * between client and server, so this inures us to those differences.
 */
const normalize = (node: Node | null) => {
  if (node === null) {
    return;
  }
  let nextSibling = node.nextSibling;
  // Remove comments
  if (node.nodeType === node.COMMENT_NODE) {
    node.parentNode!.removeChild(node);
  }
  // Normalize text content (we don't use node.normalize, because
  // it doesn't work on IE)
  else if (node.nodeType === node.TEXT_NODE) {
    while (
      node.nextSibling &&
      (node.nextSibling.nodeType === node.TEXT_NODE ||
        node.nextSibling.nodeType === node.COMMENT_NODE)
    ) {
      if (node.nextSibling.nodeType === node.TEXT_NODE) {
        node.nodeValue! += node.nextSibling.nodeValue;
      }
      node.parentNode!.removeChild(node.nextSibling);
    }
    nextSibling = node.nextSibling;
  } else {
    // When parsed via the parser, the browser maintains user-authored whitespace;
    // when reset via the property it re-serializes in a normalized form
    if (node.nodeType === node.ELEMENT_NODE) {
      if ((node as HTMLElement).hasAttribute('style')) {
        (node as HTMLElement).setAttribute(
          'style',
          (node as HTMLElement).style.cssText
        );
      }
    }
    // Recurse
    normalize(node.firstChild);
  }
  // Recurse breadth-and-depth
  normalize(nextSibling);
};

/**
 * Wrapper around semantic-dom-diff assert.lightDom.equal to normalize the
 * content using the `normalize` implementation above.
 */
const assertLightDom = (
  el: Element | ShadowRoot,
  str: string,
  opt?: Parameters<typeof assert.lightDom.equal>[1]
) => {
  assertTemplate.innerHTML = el.innerHTML;
  normalize(assertTemplate.content);
  assert.lightDom.equal(assertTemplate, str, opt);
  assertTemplate.innerHTML = '';
};

/**
 * Checks a tree of expected HTML against the DOM; the expected HTML can either
 * be a string or an object containing keys of querySelector queries mapped to
 * HTML expectations for the shadow root of the returned element(s); if more
 * than one element is returned from the querySelector, the value must be an
 * array of HTML expectations. When using in tree mode, the string 'root' is
 * used as a sentinel to test the container at a given level.
 *
 * Examples:
 *
 * // Test `container` html
 * html: '<div></div>'
 *
 * // Test `container` and shadowRoot of `my-el`
 * html: {
 *   root: '<my-el></my-el>',
 *   'my-el': '<span></span>',
 *
 * // Test `container` and shadowRoot of `my-el`, and shadow root of my-el2
 * inside of it
 * html: {
 *   root: '<my-el></my-el>',
 *   'my-el': {
 *     root: '<my-el2></my-el2>'
 *     'my-el2': '<input>'
 *   },
 *
 * // Test `container` and shadowRoot series of `my-el`
 * html: {
 *   root: `
 *      <my-el></my-el>
 *      <my-el></my-el>`,
 *   'my-el': [
 *     '<div></div>',
 *     '<div></div>'
 *   ],
 */
const assertHTML = (
  container: Element | ShadowRoot,
  html: SSRExpectedHTMLGroup | SSRExpectedHTML
): void => {
  if (typeof html !== 'object') {
    assertLightDom(container, html);
  } else if (isAnyHtml(html)) {
    let pass = false;
    let lastError: unknown;
    for (const expectation of html.expectations) {
      try {
        assertHTML(container, expectation);
        pass = true;
      } catch (e) {
        lastError = e;
      }
    }
    if (!pass) {
      throw lastError;
    }
  } else {
    for (const query in html) {
      const subHtml = html[query];
      if (query === 'root') {
        assert.typeOf(
          subHtml,
          'string',
          `html expectation for ':root' must be a string.`
        );
        assertLightDom(container, subHtml as string, {
          ignoreAttributes: ['defer-hydration'],
        });
      } else {
        const subContainers = Array.from(container.querySelectorAll(query));
        if (Array.isArray(subHtml)) {
          assert.strictEqual(
            subContainers.length,
            subHtml.length,
            `Did not find expected number of elements for query '${query}'`
          );
          subContainers.forEach((subContainer, i) => {
            assert.instanceOf(
              subContainer.shadowRoot,
              ShadowRoot,
              `No shadowRoot for queried element '${query}[${i}]'`
            );
            assertHTML(subContainer.shadowRoot!, subHtml[i]);
          });
        } else {
          assert.strictEqual(
            subContainers.length,
            1,
            `Number of nodes found for element query '${query}'`
          );
          assert.instanceOf(
            subContainers[0].shadowRoot,
            ShadowRoot,
            `No shadowRoot for queried element '${query}'`
          );
          assertHTML(subContainers[0].shadowRoot!, subHtml);
        }
      }
    }
  }
};

const modes = ['vm', 'vm-shimmed', 'global', 'global-shimmed'] as const;
export const setupTest = async (
  tests: SSRTestSuite,
  testFile: string,
  mode: (typeof modes)[number] = 'vm'
) => {
  suite(`${testFile}: ${mode}`, () => {
    let container: HTMLElement;
    let observer: MutationObserver;
    let _mutations: Array<MutationRecord>;

    const clearMutations = () => {
      observer.takeRecords();
      _mutations.length = 0;
    };

    const getMutations = () => {
      _mutations.push(...observer.takeRecords());
      return _mutations;
    };

    const observeMutations = (container: Element) => {
      observer.observe(container, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });
      // Deeply observe all roots
      Array.from(container.querySelectorAll('*'))
        .filter((el) => el.shadowRoot)
        .forEach((el) => observeMutations(el));
    };

    setup(() => {
      // Container is appended to body so that CE upgrades run
      container = document.createElement('div');
      document.body.appendChild(container);
      _mutations = [];
      observer = new MutationObserver((records) => {
        _mutations.push(...records);
      });
      clearMutations();
    });

    teardown(() => {
      document.body.removeChild(container);
    });

    for (const [testName, testDescOrFn] of Object.entries(tests)) {
      const testSetup =
        typeof testDescOrFn === 'function' ? testDescOrFn() : testDescOrFn;
      const {
        render: testRender,
        registerElements,
        expectations,
        stableSelectors,
        expectMutationsOnFirstRender,
        expectMutationsDuringHydration,
        expectMutationsDuringUpgrade,
        skipPreHydrationAssertHtml,
      } = testSetup;

      const testFn =
        testSetup.skip || skipSSRTests
          ? test.skip
          : // eslint-disable-next-line no-only-tests/no-only-tests
          testSetup.only
          ? // eslint-disable-next-line no-only-tests/no-only-tests
            test.only
          : test;

      testFn(testName, async () => {
        // Get the SSR result from the server.
        const response = await fetch(`/render/${mode}/${testFile}/${testName}`);
        container.innerHTML = await response.text();

        // For element tests, hydrate shadowRoots
        if (typeof registerElements === 'function') {
          hydrateShadowRoots(container);
        }

        // Start watching for mutations (deeply into any shadowRoots)
        observeMutations(container);

        // The first expectation args are used in the server render. Check the DOM
        // pre-hydration to make sure they're correct. The DOM is changed again
        // against the first expectation after hydration in the loop below.
        if (!skipPreHydrationAssertHtml) {
          assertHTML(container, expectations[0].html);
        }
        const stableNodes = stableSelectors.map((selector) =>
          container.querySelector(selector)
        );
        clearMutations();

        // For element tests, register & upgrade/hydrate elements
        if (typeof registerElements === 'function') {
          await registerElements();
          assertHTML(container, expectations[0].html);
          if (!expectMutationsDuringUpgrade) {
            assert.isEmpty(
              getMutations(),
              'Upgrading elements should cause no DOM mutations'
            );
          }
        }

        let i = 0;
        for (const {args, html, setup, check} of expectations) {
          if (i === 0) {
            hydrate(testRender(...args), container);
            // Hydration should cause no DOM mutations, because it does not
            // actually update the DOM - it just recreates data structures
            if (!expectMutationsDuringHydration) {
              assert.isEmpty(
                getMutations(),
                'Hydration should cause no DOM mutations'
              );
            }
            clearMutations();
          }

          // Custom setup callback
          if (setup !== undefined) {
            const ret = setup(assert, container);
            // Avoid introducing microtasks unless setup function was async
            if (ret && (ret as PromiseLike<void>).then) {
              await ret;
            }
          }

          // After hydration, render() will be operable.
          render(testRender(...args), container);

          if (i === 0) {
            // The first render should also cause no mutations, since it's using
            // the same data as the server.
            if (!expectMutationsOnFirstRender) {
              assert.isEmpty(
                getMutations(),
                'First render should cause no DOM mutations'
              );
            }
          }

          // Custom check before HTML assertion, so it can await el.updateComplete
          if (check !== undefined) {
            const ret = check(assert, container);
            // Avoid introducing microtasks unless check function was async
            if (ret && (ret as PromiseLike<void>).then) {
              await ret;
            }
          }

          // Check that stable nodes didn't change
          const checkNodes = stableSelectors.map((selector) =>
            container.querySelector(selector)
          );
          assert.deepEqual(stableNodes, checkNodes);

          // Check the markup
          assertHTML(container, html);

          i++;
        }
      });
    }
  });
};
