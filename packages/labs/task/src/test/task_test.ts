/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement, PropertyValues} from '@lit/reactive-element';
import {ReactiveController} from '@lit/reactive-element/reactive-controller.js';
import {property} from '@lit/reactive-element/decorators/property.js';
import {initialState, Task, TaskStatus} from '../task.js';
import {generateElementName, nextFrame} from './test-helpers';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!ReactiveElement.enableWarning;

if (DEV_MODE) {
  ReactiveElement.disableWarning?.('change-in-update');
}

suite('Task', () => {
  let container: HTMLElement;

  class ControllerUsingTask implements ReactiveController {
    updateCount = 0;

    host: ReactiveElement;
    task: Task;

    constructor(host: ReactiveElement) {
      this.host = host;
      this.host.addController(this);
      this.task = new Task(
        this.host,
        ([id]) =>
          new Promise((resolve) => {
            this.resolveTask = () => resolve(`result: ${id}`);
          }),
        () => [this.id]
      );
    }

    hostUpdated() {
      this.updateCount++;
    }

    private _id = 0;

    get id() {
      return this._id;
    }

    set id(value: number) {
      this._id = value;
      this.host.requestUpdate();
    }

    resolveTask!: () => void;

    get value() {
      return this.task.value;
    }

    get error() {
      return this.task.error;
    }

    get status(): TaskStatus {
      return this.task.status;
    }
  }

  class A extends ReactiveElement {
    @property()
    foo = 'foo';
    @property()
    bar = 'bar';
    @property()
    zot?: string;
    renderedStatus?: string;
    taskController = new ControllerUsingTask(this);
    resolveTask!: () => void;
    rejectTask!: () => void;
    resolveRenderedStatusTask!: () => void;
    rejectRenderedStatusTask!: () => void;
    taskValue?: unknown;
    taskControllerValue?: unknown;
    task = new Task<[string, string], string>(
      this,
      ([foo, bar]) =>
        new Promise((resolve, reject) => {
          this.rejectTask = () => reject(`error`);
          this.resolveTask = () => resolve(`result: ${foo}, ${bar}`);
        }),
      () => [this.foo, this.bar]
    );
    renderedStatusTask = new Task<[string?], string>(
      this,
      ([zot]) =>
        new Promise((resolve, reject) => {
          this.rejectRenderedStatusTask = () => reject(`error`);
          this.resolveRenderedStatusTask = () => resolve(`result: ${zot}`);
        }),
      () => [this.zot]
    );

    update(changedProperties: PropertyValues) {
      super.update(changedProperties);
      this.taskValue = this.task.value ?? this.task.error;
      this.taskControllerValue =
        this.taskController.value ?? this.taskController.error;
      el.renderedStatusTask.render({
        initial: () => (this.renderedStatus = 'initial'),
        pending: () => (this.renderedStatus = 'pending'),
        complete: (value: unknown) => (this.renderedStatus = value as string),
        error: (error: unknown) => (this.renderedStatus = error as string),
      });
    }
  }
  customElements.define(generateElementName(), A);
  let el!: A;

  const tasksUpdateComplete = nextFrame;

  setup(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    el = new A();
    container.appendChild(el);
    await el.updateComplete;
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('initial status', async () => {
    el = new A();
    assert.equal(el.task.value, undefined);
    assert.equal(el.task.status, TaskStatus.INITIAL);
    assert.equal(el.taskController.value, undefined);
    assert.equal(el.taskController.status, TaskStatus.INITIAL);
  });

  test('pending and complete status', async () => {
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskController.status, TaskStatus.PENDING);
    el.resolveTask();
    el.taskController.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskController.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, 'result: foo, bar');
    assert.equal(el.taskControllerValue, 'result: 0');
  });

  test('error status', async () => {
    assert.equal(el.task.status, TaskStatus.PENDING);
    el.rejectTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.ERROR);
    assert.equal(el.task.error, 'error');
    assert.equal(el.task.value, undefined);
    assert.equal(el.taskValue, 'error');
    // new ok task after initial error
    el.foo = 'foo1';
    el.bar = 'bar1';
    await el.updateComplete;
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.task.error, undefined);
    let expected = 'result: foo1, bar1';
    assert.equal(el.task.value, expected);
    assert.equal(el.taskValue, expected);
    // new error task after ok task
    el.foo = 'foo2';
    el.bar = 'bar2';
    await el.updateComplete;
    el.rejectTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.ERROR);
    assert.equal(el.task.error, 'error');
    assert.equal(el.task.value, undefined);
    assert.equal(el.taskValue, 'error');
    // new ok task after error task
    el.foo = 'foo3';
    el.bar = 'bar3';
    await el.updateComplete;
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.task.error, undefined);
    expected = 'result: foo3, bar3';
    assert.equal(el.task.value, expected);
    assert.equal(el.taskValue, expected);
  });

  test('runs when deps change', async () => {
    el.resolveTask();
    el.taskController.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskController.status, TaskStatus.COMPLETE);
    el.requestUpdate();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskController.status, TaskStatus.COMPLETE);
    el.foo = 'foo1';
    el.bar = 'bar1';
    el.taskController.id = 1;
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskController.status, TaskStatus.PENDING);
    el.resolveTask();
    el.taskController.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskController.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, 'result: foo1, bar1');
    assert.equal(el.taskControllerValue, 'result: 1');
  });

  test('reports only most recent value', async () => {
    const initialFinishTask = el.resolveTask;
    const initialControllerFinishTask = el.taskController.resolveTask;
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskController.status, TaskStatus.PENDING);
    el.foo = 'foo1';
    el.bar = 'bar1';
    el.taskController.id = 1;
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskController.status, TaskStatus.PENDING);
    el.resolveTask();
    el.taskController.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskController.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, 'result: foo1, bar1');
    assert.equal(el.taskControllerValue, 'result: 1');
    // complete previous task
    initialFinishTask();
    initialControllerFinishTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskController.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, 'result: foo1, bar1');
    assert.equal(el.taskControllerValue, 'result: 1');
  });

  test('task.render renders current status', async () => {
    assert.equal(el.renderedStatus, 'initial');
    el.zot = 'zot';
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'pending');
    el.resolveRenderedStatusTask();
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'result: zot');
    el.zot = 'zot2';
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'pending');
    el.rejectRenderedStatusTask();
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'error');
    el.zot = 'zot3';
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'pending');
    el.resolveRenderedStatusTask();
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'result: zot3');
  });

  test('task functions can return initial state', async () => {
    class TestEl extends ReactiveElement {
      @property()
      state = '';

      task = new Task(
        this,
        async ([state]) => (state === 'initial' ? initialState : 'A'),
        () => [this.state]
      );

      t2 = new Task(
        this,
        () => new Promise(() => []),
        () => []
      );
    }
    customElements.define(generateElementName(), TestEl);

    const el = new TestEl();
    assert.equal(el.task.status, TaskStatus.INITIAL, 'initial');
    container.append(el);

    // After one microtask we expect the task function to have been
    // called, but not completed
    await Promise.resolve();
    assert.equal(el.task.status, TaskStatus.PENDING, 'pending');

    await Promise.resolve();
    assert.equal(el.task.status, TaskStatus.COMPLETE, 'complete');

    el.state = 'initial';

    await new Promise((r) => setTimeout(r, 0));
    assert.equal(el.task.status, TaskStatus.INITIAL, 'new initial');
  });
});
