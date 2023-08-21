/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import {assert} from '@esm-bundle/chai';
import {
  SpringConfig,
  Spring2DConfig,
  SpringController,
  SpringController2D,
} from '../spring.js';

suite('Spring', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    container?.remove();
  });

  suite('SpringController', () => {
    @customElement('spring-controller-test')
    class SpringControllerTest extends LitElement {
      spring: SpringController;
      constructor(options?: Partial<SpringConfig> | undefined) {
        super();
        this.spring = new SpringController(this, options);
      }
    }

    test('spring is initially stopped, and initial params', async () => {
      const el = new SpringControllerTest({fromValue: 100, toValue: 50});
      // This one isn't what you might expect, but is what Wobble returns
      assert.isFalse(el.spring.isAtRest);

      assert.isFalse(el.spring.isAnimating);
      assert.equal(el.spring.currentValue, 100);
      assert.equal(el.spring.currentVelocity, 0);
      assert.equal(el.spring.toValue, 50);
      await new Promise((res) => setTimeout(res, 1));

      // Make sure it's not moving
      assert.isFalse(el.spring.isAnimating);
      assert.equal(el.spring.currentValue, 100);
      assert.equal(el.spring.currentVelocity, 0);
      assert.equal(el.spring.toValue, 50);
    });

    test('spring starts when connected, stops when disconnected', async () => {
      const el = new SpringControllerTest({fromValue: 100, toValue: 50});
      container.append(el);
      assert.isFalse(el.spring.isAtRest);
      assert.isTrue(el.spring.isAnimating);
      assert.equal(el.spring.currentValue, 100);
      assert.equal(el.spring.currentVelocity, 0);
      assert.equal(el.spring.toValue, 50);

      // Wait at least a frame
      await new Promise((res) => requestAnimationFrame(res));

      // Make sure it's moving
      assert.isFalse(el.spring.isAtRest);
      assert.isTrue(el.spring.isAnimating);
      assert.isTrue(el.spring.currentValue < 100);
      assert.isTrue(el.spring.currentVelocity < 0);

      // make sure it stops
      el.remove();
      assert.isFalse(el.spring.isAnimating);
    });
  });

  suite('SpringController2D', () => {
    @customElement('spring-controller-2d-test')
    class SpringController2DTest extends LitElement {
      spring: SpringController2D;
      constructor(options?: Spring2DConfig | undefined) {
        super();
        this.spring = new SpringController2D(this, options);
      }
    }

    test('spring is initially stopped, and initial params', async () => {
      const el = new SpringController2DTest({
        fromPosition: {x: 100, y: 100},
        toPosition: {x: 50, y: 50},
      });

      assert.isFalse(el.spring.isAtRest);

      assert.isFalse(el.spring.isAnimating);
      assert.deepEqual(el.spring.currentPosition, {x: 100, y: 100});
      assert.equal(el.spring.currentVelocity, 0);
      assert.deepEqual(el.spring.toPosition, {x: 50, y: 50});
      await new Promise((res) => setTimeout(res, 1));

      // Make sure it's not moving
      assert.isFalse(el.spring.isAnimating);
      assert.deepEqual(el.spring.currentPosition, {x: 100, y: 100});
      assert.equal(el.spring.currentVelocity, 0);
      assert.deepEqual(el.spring.toPosition, {x: 50, y: 50});
    });

    test('spring starts when connected, stop when disconnected', async () => {
      const el = new SpringController2DTest({
        fromPosition: {x: 100, y: 100},
        toPosition: {x: 50, y: 50},
      });
      container.append(el);
      assert.isFalse(el.spring.isAtRest);
      assert.isTrue(el.spring.isAnimating);
      assert.deepEqual(el.spring.currentPosition, {x: 100, y: 100});
      assert.equal(el.spring.currentVelocity, 0);
      assert.deepEqual(el.spring.toPosition, {x: 50, y: 50});

      // Wait at least a frame
      await new Promise((res) => requestAnimationFrame(res));

      // Make sure it's moving
      assert.isFalse(el.spring.isAtRest);
      assert.isTrue(el.spring.isAnimating);
      assert.isTrue(el.spring.currentPosition.x < 100);
      assert.isTrue(el.spring.currentPosition.y < 100);

      // TODO(justinfagnani): should velocity be a vector?
      assert.isTrue(el.spring.currentVelocity > 0);

      // make sure it stops
      el.remove();
      assert.isFalse(el.spring.isAnimating);
    });
  });
});
