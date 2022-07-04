/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement, PropertyValues} from '@lit/reactive-element';
import {property} from '@lit/reactive-element/decorators/property.js';
import {initialState, Task, TaskStatus, TaskConfig} from '@lit-labs/task';
import {generateElementName, nextFrame} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

// Note, since tests are not built with production support, detect DEV_MODE
// by checking if warning API is available.
const DEV_MODE = !!ReactiveElement.enableWarning;

if (DEV_MODE) {
  ReactiveElement.disableWarning?.('change-in-update');
}

suite('Task', () => {
  let container: HTMLElement;

  interface TestElement extends ReactiveElement {
    task: Task;
    a: string;
    b: string;
    c?: string;
    resolveTask: () => void;
    rejectTask: () => void;
    taskValue?: string;
    renderedStatus?: string;
  }

  const defineTestElement = (
    config?: Partial<TaskConfig<unknown[], string>>
  ) => {
    class A extends ReactiveElement {
      task: Task;

      @property()
      a = 'a';
      @property()
      b = 'b';
      @property()
      c?: string;

      resolveTask!: () => void;
      rejectTask!: () => void;

      taskValue?: string;
      renderedStatus?: string;

      constructor() {
        super();
        const taskConfig = {
          task: (...args: unknown[]) =>
            new Promise((resolve, reject) => {
              this.rejectTask = () => reject(`error`);
              this.resolveTask = () => resolve(args.join(','));
            }),
        };
        Object.assign(taskConfig, config);
        this.task = new Task(this, taskConfig);
      }

      override update(changedProperties: PropertyValues): void {
        super.update(changedProperties);
        this.taskValue = this.task.value ?? this.task.error;
        this.task.render({
          initial: () => (this.renderedStatus = 'initial'),
          pending: () => (this.renderedStatus = 'pending'),
          complete: (value: unknown) => (this.renderedStatus = value as string),
          error: (error: unknown) => (this.renderedStatus = error as string),
        });
      }
    }
    customElements.define(generateElementName(), A);
    return A;
  };

  const renderElement = async (el: TestElement) => {
    container.appendChild(el);
    await el.updateComplete;
    return el;
  };

  const getTestElement = (config?: Partial<TaskConfig<unknown[], string>>) => {
    const A = defineTestElement(config);
    return new A();
  };

  const tasksUpdateComplete = nextFrame;

  setup(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('task without args do not run', async () => {
    const el = await renderElement(getTestElement());
    assert.equal(el.task.status, TaskStatus.INITIAL);
    assert.equal(el.taskValue, undefined);
    el.requestUpdate();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.INITIAL);
    assert.equal(el.taskValue, undefined);
  });

  test('tasks with args run initially', async () => {
    const el = getTestElement({args: () => [el.a, el.b]});
    await renderElement(el);
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskValue, undefined);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a,b`);
  });

  test('tasks with empty args array run once', async () => {
    const el = getTestElement({args: () => []});
    await renderElement(el);
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskValue, undefined);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, ``);
    // Change a property that provokes an update and check that task is not run.
    el.a = 'a1';
    assert.isTrue(el.isUpdatePending);
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, ``);
  });

  test('tasks do not run when args do not change', async () => {
    const el = getTestElement({args: () => [el.a, el.b]});
    await renderElement(el);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a,b`);
    // Provoke an update and check that task does not run.
    el.c = 'c';
    assert.isTrue(el.isUpdatePending);
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a,b`);
  });

  test('tasks with args run when args change', async () => {
    const el = getTestElement({args: () => [el.a, el.b]});
    await renderElement(el);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a,b`);

    // *** Changing task argument runs task
    el.a = 'a1';
    // Check task pending.
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskValue, undefined);
    // Complete task and check result.
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a1,b`);

    // *** Changing other task argument runs task
    el.b = 'b1';
    // Check task pending.
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskValue, undefined);
    // Complete task and check result.
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a1,b1`);
  });

  test('tasks do not run when `autoRun` is `false`', async () => {
    const el = getTestElement({args: () => [el.a, el.b], autoRun: false});
    await renderElement(el);
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.INITIAL);
    assert.equal(el.taskValue, undefined);
    // Provoke update and check that task is not run.
    el.a = 'a1';
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.INITIAL);
    assert.equal(el.taskValue, undefined);
  });

  test('task `autoRun` is settable', async () => {
    const el = getTestElement({args: () => [el.a, el.b], autoRun: false});
    await renderElement(el);
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.INITIAL);
    assert.equal(el.taskValue, undefined);

    // *** Set `autoRun` to `true` and change a task argument
    el.task.autoRun = true;
    el.a = 'a1';
    // Check task is pending.
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskValue, undefined);
    el.resolveTask();
    // Check task completes.
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a1,b`);
    // *** Set `autoRun` to `false` and check that task does not run.
    el.task.autoRun = false;
    el.b = 'b1';
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a1,b`);
  });

  test('task runs when `run` called', async () => {
    const el = getTestElement({args: () => [el.a, el.b], autoRun: false});
    await renderElement(el);
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.INITIAL);
    assert.equal(el.taskValue, undefined);

    // Task runs when `autoRun` is `false` and `run()` ia called.
    el.task.run();
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a,b`);

    // Task runs when `autoRun` is `true` and `run()` ia called.
    el.task.autoRun = true;
    el.task.run();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskValue, undefined);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a,b`);
  });

  test('task `run` optionally accepts args', async () => {
    const el = getTestElement({args: () => [el.a, el.b], autoRun: false});
    await renderElement(el);
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.INITIAL);
    assert.equal(el.taskValue, undefined);

    // Can specify arguments for this call to `run()`.
    el.task.run(['d', 'e']);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `d,e`);

    // When no arguments specified, configured arguments are used.
    el.task.run();
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a,b`);
  });

  test('task reports error status', async () => {
    const el = getTestElement({args: () => [el.a, el.b]});
    await renderElement(el);
    assert.equal(el.task.status, TaskStatus.PENDING);

    // Catch the rejection to supress uncaught rejection warnings
    el.task.taskComplete.catch(() => {});
    // Task error reported.
    el.rejectTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.ERROR);
    assert.equal(el.task.error, 'error');
    assert.equal(el.task.value, undefined);
    assert.equal(el.taskValue, 'error');

    // After error, task can be run again when arguments change.
    el.a = 'a1';
    el.b = 'b1';
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.task.error, undefined);
    let expected = 'a1,b1';
    assert.equal(el.task.value, expected);
    assert.equal(el.taskValue, expected);

    // After success, an error can be reported.
    el.a = 'a2';
    el.b = 'b2';
    await tasksUpdateComplete();
    // Catch the rejection to supress uncaught rejection warnings
    el.task.taskComplete.catch(() => {});
    el.rejectTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.ERROR);
    assert.equal(el.task.error, 'error');
    assert.equal(el.task.value, undefined);
    assert.equal(el.taskValue, 'error');

    // After another error, task can be run again when arguments change.
    el.a = 'a3';
    el.b = 'b3';
    await tasksUpdateComplete();
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.task.error, undefined);
    expected = 'a3,b3';
    assert.equal(el.task.value, expected);
    assert.equal(el.taskValue, expected);
  });

  test('reports only most recent value', async () => {
    const el = getTestElement({args: () => [el.a, el.b]});
    await renderElement(el);
    const initialFinishTask = el.resolveTask;
    assert.equal(el.task.status, TaskStatus.PENDING);

    // While 1st task is pending, change arguments, provoking a new task run.
    el.a = 'a1';
    el.b = 'b1';
    await tasksUpdateComplete();

    // Complete 2nd task.
    assert.equal(el.task.status, TaskStatus.PENDING);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, 'a1,b1');

    // Complete 1st task
    initialFinishTask();
    assert.isFalse(el.isUpdatePending);
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, 'a1,b1');
  });

  test('task.render renders current status', async () => {
    const el = getTestElement({args: () => [el.a, el.b], autoRun: false});
    await renderElement(el);
    // Reports initial status When `autoRun` is `false`.
    assert.equal(el.renderedStatus, 'initial');
    el.task.autoRun = true;

    // Reports pending after a task argument changes.
    el.a = 'a1';
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'pending');
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'a1,b');
    el.b = 'b1';
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'pending');

    // Catch the rejection to supress uncaught rejection warnings
    el.task.taskComplete.catch(() => {});
    // Reports error after task rejects.
    el.rejectTask();
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'error');

    // Reports properly after error.
    el.a = 'a2';
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'pending');
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'a2,b1');
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
    }
    customElements.define(generateElementName(), TestEl);

    const el = new TestEl();
    assert.equal(el.task.status, TaskStatus.INITIAL, 'initial');
    container.append(el);

    // After one microtask we expect the task function to have been
    // called, but not completed
    await Promise.resolve();
    assert.equal(el.task.status, TaskStatus.PENDING, 'pending');

    await el.task.taskComplete;
    assert.equal(el.task.status, TaskStatus.COMPLETE, 'complete');
    assert.equal(el.task.value, 'A');

    // Kick off a new task run
    el.state = 'initial';

    // We need to wait for the element to update, and then the task to run,
    // so we wait a event loop turn:
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(el.task.status, TaskStatus.INITIAL, 'new initial');
  });
});
