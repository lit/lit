/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement, PropertyValues} from '@lit/reactive-element';
import {property} from '@lit/reactive-element/decorators/property.js';
import {initialState, Task, TaskStatus, TaskConfig} from '../task.js';
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

  test('tasks with args run when args change', async () => {
    const el = getTestElement({args: () => [el.a, el.b]});
    await renderElement(el);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a,b`);
    el.a = 'a1';
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskValue, undefined);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a1,b`);
    el.b = 'b1';
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskValue, undefined);
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
    el.task.autoRun = true;
    el.a = 'a1';
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskValue, undefined);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a1,b`);
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
    el.task.run();
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a,b`);
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
    el.task.run(['d', 'e']);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `d,e`);
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
    el.rejectTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.ERROR);
    assert.equal(el.task.error, 'error');
    assert.equal(el.task.value, undefined);
    assert.equal(el.taskValue, 'error');
    // new ok task after initial error
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
    // new error task after ok task
    el.a = 'a2';
    el.b = 'b2';
    await tasksUpdateComplete();
    el.rejectTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.ERROR);
    assert.equal(el.task.error, 'error');
    assert.equal(el.task.value, undefined);
    assert.equal(el.taskValue, 'error');
    // new ok task after error task
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

  // test('runs when args change', async () => {
  //   el.resolveTask();
  //   el.taskController.resolveTask();
  //   await tasksUpdateComplete();
  //   assert.equal(el.task.status, TaskStatus.COMPLETE);
  //   assert.equal(el.taskController.status, TaskStatus.COMPLETE);
  //   el.requestUpdate();
  //   await tasksUpdateComplete();
  //   assert.equal(el.task.status, TaskStatus.COMPLETE);
  //   assert.equal(el.taskController.status, TaskStatus.COMPLETE);
  //   el.foo = 'foo1';
  //   el.bar = 'bar1';
  //   el.taskController.id = 1;
  //   await tasksUpdateComplete();
  //   assert.equal(el.task.status, TaskStatus.PENDING);
  //   assert.equal(el.taskController.status, TaskStatus.PENDING);
  //   el.resolveTask();
  //   el.taskController.resolveTask();
  //   await tasksUpdateComplete();
  //   assert.equal(el.task.status, TaskStatus.COMPLETE);
  //   assert.equal(el.taskController.status, TaskStatus.COMPLETE);
  //   assert.equal(el.taskValue, 'result: foo1, bar1');
  //   assert.equal(el.taskControllerValue, 'result: 1');
  // });

  test('reports only most recent value', async () => {
    const el = getTestElement({args: () => [el.a, el.b]});
    await renderElement(el);
    const initialFinishTask = el.resolveTask;
    assert.equal(el.task.status, TaskStatus.PENDING);
    el.a = 'a1';
    el.b = 'b1';
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, 'a1,b1');
    // complete previous task
    initialFinishTask();
    assert.isFalse(el.isUpdatePending);
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, 'a1,b1');
  });

  test('task.render renders current status', async () => {
    const el = getTestElement({args: () => [el.a, el.b], autoRun: false});
    await renderElement(el);
    assert.equal(el.renderedStatus, 'initial');
    el.task.autoRun = true;
    el.a = 'a1';
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'pending');
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'a1,b');
    el.b = 'b1';
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'pending');
    el.rejectTask();
    await tasksUpdateComplete();
    assert.equal(el.renderedStatus, 'error');
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
