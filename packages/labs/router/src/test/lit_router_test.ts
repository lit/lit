/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {stripExpressionComments} from '@lit-labs/testing';
import {assert} from '@esm-bundle/chai';

import 'urlpattern-polyfill';

import {LitRouter} from '@lit-labs/router';
import '@lit-labs/router';

// Imports static pages
import './pages/home-page.js';
import './pages/about-page.js';

const _delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const _hasFibonacciNumber = (number: number) => {
  if (number < 0) return false;

  let a = 0;
  let b = 1;

  while (b < number) {
    const temp = b;

    b = a + b;
    a = temp;
  }

  return b === number;
};

const canTest =
  window.ShadowRoot &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  !(window as any).ShadyDOM?.inUse;

(canTest ? suite : suite.skip)('LitRouter', () => {
  let $router: LitRouter;

  setup(async () => {
    $router = document.createElement('lit-router') as LitRouter;

    $router.setRoutes([
      {
        path: '/',
        component: 'home-page',
      },
      {
        path: '/about',
        component: 'about-page',
      },
      {
        path: '/dashboard',
        component: () =>
          import('./pages/dashboard-page.js').then((m) => m.DashboardPage),
        beforeEnter: [
          ({navigate, qs}) => {
            const token = qs('token');

            if (!token) {
              navigate({path: '/'});
              return false;
            }

            return true;
          },
        ],
        children: [
          {
            path: '/users/:id',
            component: () =>
              import('./pages/users-page.js').then((m) => m.UsersPage),
            beforeEnter: [
              ({params}) => {
                const userId = Number(params('id'));

                return _hasFibonacciNumber(userId);
              },
            ],
          },
        ],
      },
      {
        path: '*',
        component: () =>
          import('./pages/not-found-page.js').then((m) => m.NotFoundPage),
      },
    ]);

    document.body.appendChild($router);

    await _delay(50);
  });

  teardown(() => {
    $router?.remove();
  });

  test('Check that the initial route is (/)', () => {
    assert.isDefined($router);

    const $homepage = $router.querySelector('home-page');

    assert.isDefined($homepage);
    assert.equal(
      stripExpressionComments($homepage!.shadowRoot!.innerHTML),
      '<h1>Home Page</h1>'
    );
  });

  test('Check that the route changes to (/about)', async () => {
    $router.navigate({path: '/about'});

    await _delay(50);

    assert.equal($router.querySelector('home-page'), null);

    const $aboutPage = $router.querySelector('about-page');

    assert.isDefined($aboutPage);
    assert.equal(
      stripExpressionComments($aboutPage!.shadowRoot!.innerHTML),
      '<h1>About Page</h1>'
    );
  });

  test('Check wildcard routes (404 not found)', async () => {
    $router.navigate({path: '/random'});

    await _delay(1000);

    const $notFoundPage = $router.querySelector('not-found-page');

    assert.isDefined($notFoundPage);
    assert.equal(
      stripExpressionComments($notFoundPage!.shadowRoot!.innerHTML),
      '<h1>404 | Not Found</h1>'
    );
  });

  test('Check the route guards', async () => {
    $router.navigate({path: '/dashboard'});

    await _delay(100);

    const $homePage = $router.querySelector('home-page');
    assert.equal(
      stripExpressionComments($homePage!.shadowRoot!.innerHTML),
      '<h1>Home Page</h1>'
    );

    $router.navigate({
      path: '/dashboard',
      query: {token: '123'},
    });

    await _delay(100);

    const $dashboardPage = $router.querySelector('dashboard-page');

    assert.match(
      stripExpressionComments($dashboardPage!.shadowRoot!.innerHTML),
      /Dashboard Page/
    );

    $router.navigate({
      path: '/dashboard/users/4',
      query: {token: '123'},
    });

    await _delay(100);

    assert.equal($router.querySelector('users-page'), null);

    $router.navigate({
      path: '/dashboard/users/1',
      query: {token: '123'},
    });

    await _delay(100);

    const $usersPage = $router.querySelector('users-page');

    assert.equal(
      stripExpressionComments($usersPage!.shadowRoot!.innerHTML),
      '<h1>Users Page 1</h1>'
    );
  });

  test('Check that back() navigation function', async () => {
    $router.back();

    await _delay(50);

    const $dashboardPage = $router.querySelector('dashboard-page');

    assert.match(
      stripExpressionComments($dashboardPage!.shadowRoot!.innerHTML),
      /<h1>Dashboard Page<\/h1>/
    );
  });

  test('Check that forward() navigation function', async () => {
    $router.forward();

    await _delay(50);

    const $usersPage = $router.querySelector('users-page');

    assert.equal(
      stripExpressionComments($usersPage!.shadowRoot!.innerHTML),
      '<h1>Users Page 1</h1>'
    );
  });

  test('Check that qs() function', async () => {
    $router.navigate({
      path: '/dashboard/users/8',
      query: {
        token: '123',
        name: 'Ivan Guevara',
        country: 'El Salvador',
        age: '23',
      },
    });

    await _delay(50);

    const queriesObj = $router.qs();

    assert.deepEqual(queriesObj, {
      token: '123',
      name: 'Ivan Guevara',
      country: 'El Salvador',
      age: '23',
    });

    const token = $router.qs('token');
    const name = $router.qs('name');
    const country = $router.qs('country');

    assert.equal(token, '123');
    assert.equal(name, 'Ivan Guevara');
    assert.equal(country, 'El Salvador');
  });

  test('Check that params() function', async () => {
    $router.navigate({
      path: '/dashboard/users/8',
      query: {
        token: '123',
      },
    });

    await _delay(50);

    const paramsObj = $router.params();

    assert.deepEqual(paramsObj, {
      id: '8',
    });

    const id = $router.params('id');

    assert.equal(id, '8');
  });

  test('Check that routes() function', async () => {
    const routes = $router.routes();

    assert.equal(routes.length, 4);
  });
});
