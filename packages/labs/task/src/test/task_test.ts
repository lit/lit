/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveElement, LitElement, html, PropertyValues} from 'lit';
import {property, query} from 'lit/decorators.js';
import {
  initialState,
  Task,
  TaskStatus,
  TaskConfig,
  TaskFunctionOptions,
} from '@lit-labs/task';
import {deepArrayEquals} from '@lit-labs/task/deep-equals.js';
import {generateElementName, nextFrame} from './test-helpers.js';
import {assert} from '@esm-bundle/chai';

// Safari didn't support reasons until 15.4
const supportsAbortSignalReason = (() => {
  const controller = new AbortController();
  const {signal} = controller;
  controller.abort('reason');
  return signal.reason === 'reason';
})();

suite('Task', () => {
  let container: HTMLElement;

  interface TestElement extends ReactiveElement {
    task: Task;
    a: string;
    b: string;
    c?: string;
    resolveTask: () => void;
    rejectTask: (error: string | undefined) => void;
    signal?: AbortSignal;
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
      rejectTask!: (error: string | undefined) => void;
      signal?: AbortSignal;

      taskValue?: string;
      renderedStatus?: string;

      constructor() {
        super();
        const taskConfig = {
          task: (args: readonly unknown[], options?: TaskFunctionOptions) =>
            new Promise((resolve, reject) => {
              this.rejectTask = (error) => reject(error);
              this.resolveTask = () => resolve(args.join(','));
              const signal = (this.signal = options?.signal);
              if (signal?.aborted) {
                reject(signal.reason);
              } else {
                signal?.addEventListener('abort', () => {
                  reject(signal.reason);
                });
              }
            }),
        };
        Object.assign(taskConfig, config);
        this.task = new Task(this, taskConfig);
      }

      override update(changedProperties: PropertyValues): void {
        super.update(changedProperties);
        this.taskValue = (this.task.value as string) ?? this.task.error;
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

  // TODO: the name of this function is confusing. It doesn't wait for the task
  // to complete. It just waits a rAF. That's why it can be used to check that
  // a task is pending.
  const tasksUpdateComplete = nextFrame;

  let warnMessages: Array<string>;
  const originalConsoleWarn = console.warn;

  suiteSetup(() => {
    // Patch console.warn to check warnings
    console.warn = (...args) => {
      warnMessages.push(args.join(' '));
      return originalConsoleWarn.apply(console, args);
    };
  });

  suiteTeardown(() => {
    // Un-patch console.warn
    console.warn = originalConsoleWarn;
  });

  setup(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    warnMessages = [];

    // Individual tests can enable the warning
    // ReactiveElement.disableWarning?.('change-in-update');
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
    assert.equal(el.taskValue, 'a,b');
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
    assert.equal(el.taskValue, 'a1,b');
    // Complete task and check result.
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a1,b1`);
  });

  test('tasks with args run when args change: deepEqual', async () => {
    const el = getTestElement({
      // Wrapping the args in array causes there to be a fresh value every
      // update, which deepArrayEquals will compare and return true for.
      args: () => [[el.a], [el.b]],
      argsEqual: deepArrayEquals,
    });
    await renderElement(el);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a,b`);

    // Changing task argument runs task
    el.a = 'a1';
    // Check task pending.
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskValue, 'a,b');
    // Complete task and check result.
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a1,b`);

    // No change in arguments doesn't run task
    el.requestUpdate();
    // Check task pending.
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
  });

  test('tasks can have initialValue', async () => {
    // The test helpers make it hard to write proper args callbacks
    // `args: () => [this.a, this.b]` would work, but `[el.a]` doesn't
    // since `el` isn't initialized yet. This little hack works:
    let initializing = true;
    const el = getTestElement({
      initialValue: 'initial',
      args: () => [initializing ? 'a' : el.a, initializing ? 'b' : el.b],
    });
    initializing = false;
    await renderElement(el);
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.task.value, 'initial');
    assert.equal(el.taskValue, 'initial');

    // The task is complete, so waiting for it shouldn't change anything
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.task.value, 'initial');

    // An element update (which checks args again) should not cause a rerun
    el.requestUpdate();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.task.value, 'initial');

    // The task still reruns when arguments change
    el.a = 'a1';
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(el.taskValue, `a1,b`);
  });

  test('task error is not reset on rerun', async () => {
    const el = getTestElement({args: () => [el.a, el.b]});
    await renderElement(el);
    el.rejectTask('error');
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.ERROR);
    assert.equal(el.taskValue, 'error');

    // *** Changing task argument runs task
    el.a = 'a1';
    // Check task pending.
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(el.taskValue, 'error');
    // Reject task and check result.
    el.rejectTask('error');
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.ERROR);
    assert.equal(el.taskValue, `error`);
  });

  test('task functions receive an AbortSignal', async () => {
    const el = getTestElement({args: () => [el.a, el.b], autoRun: false});
    await renderElement(el);

    // Initially we have no signal because the task function hasn't been run
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.INITIAL);
    assert.equal(el.signal, undefined);

    // When the task is run, we'll get a signal
    el.task.run();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.ok(el.signal);
    assert.strictEqual(el.signal?.aborted, false);

    // If we start a new run before the previous is complete, the signal
    // should be aborted
    const previousSignal = el.signal;
    el.task.run();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.strictEqual(previousSignal?.aborted, true);

    // And the new run should have a fresh, non-aborted, signal
    assert.notStrictEqual(previousSignal, el.signal);
    assert.strictEqual(el.signal?.aborted, false);

    // When the new run is complete, its signal is not aborted
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.strictEqual(el.signal?.aborted, false);
  });

  test('tasks can be aborted', async () => {
    const el = getTestElement({args: () => [el.a, el.b], autoRun: false});
    await renderElement(el);

    // We can abort a task
    el.task.run();
    el.task.abort('testing');
    await tasksUpdateComplete();
    assert.strictEqual(el.signal?.aborted, true);
    assert.equal(el.task.status, TaskStatus.ERROR);
    if (supportsAbortSignalReason) {
      assert.equal(el.task.error, 'testing');
    }

    // We can restart the task
    el.task.run();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.strictEqual(el.signal?.aborted, false);
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
    assert.equal(el.taskValue, `a,b`);
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

    // Catch the rejection to suppress uncaught rejection warnings
    el.task.taskComplete.catch(() => {});
    // Task error reported.
    el.rejectTask('error');
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
    // Catch the rejection to suppress uncaught rejection warnings
    el.task.taskComplete.catch(() => {});
    el.rejectTask('error');
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

  test('errors can be undefined', async () => {
    const el = getTestElement({args: () => [el.a, el.b]});
    await renderElement(el);

    // Catch the rejection to suppress uncaught rejection warnings
    el.task.taskComplete.catch(() => {});
    // Task error reported.
    el.rejectTask(undefined);
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.ERROR);
    assert.equal(el.task.error, undefined);
    assert.equal(el.task.value, undefined);
    assert.equal(el.taskValue, undefined);
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

    // Catch the rejection to suppress uncaught rejection warnings
    el.task.taskComplete.catch(() => {});
    // Reports error after task rejects.
    el.rejectTask('error');
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

  test('task args functions can return const arrays', () => {
    return class MyElement extends ReactiveElement {
      task = new Task(
        this,
        ([a, b]) => [a * 2, b.split('')],
        // Make sure that we can use `as const` to force inference of the args
        // as [number, string] instead of (number | string)[]
        () => [1, 'b'] as const
      );
    };
  });

  test('task functions can infer type of option param', () => {
    return class MyElement extends ReactiveElement {
      task = new Task(
        this,
        // Second param should get inferred to `TaskFunctionOptions` with an
        // `AbortSignal`
        ([a], {signal}) => (signal.throwIfAborted(), a),
        () => [1]
      );
    };
  });

  test('onComplete callback is called', async () => {
    let numOnCompleteInvocations = 0;
    let lastOnCompleteResult: string | undefined = undefined;
    const el = getTestElement({
      args: () => [el.a, el.b],
      onComplete: (result) => {
        numOnCompleteInvocations++;
        lastOnCompleteResult = result;
      },
    });
    await renderElement(el);
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(numOnCompleteInvocations, 0);
    assert.equal(lastOnCompleteResult, undefined);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(numOnCompleteInvocations, 1);
    assert.equal(lastOnCompleteResult, 'a,b');

    numOnCompleteInvocations = 0;

    // Called after every task completion.
    el.a = 'a1';
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(numOnCompleteInvocations, 0);
    assert.equal(lastOnCompleteResult, 'a,b');
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    assert.equal(numOnCompleteInvocations, 1);
    assert.equal(lastOnCompleteResult, 'a1,b');
  });

  test('onError callback is called', async () => {
    let numOnErrorInvocations = 0;
    let lastOnErrorResult: string | undefined = undefined;
    const el = getTestElement({
      args: () => [el.a, el.b],
      onError: (error) => {
        numOnErrorInvocations++;
        lastOnErrorResult = error as string;
      },
    });
    await renderElement(el);
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(numOnErrorInvocations, 0);
    assert.equal(lastOnErrorResult, undefined);
    el.rejectTask('error');
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.ERROR);
    assert.equal(numOnErrorInvocations, 1);
    assert.equal(lastOnErrorResult, 'error');

    numOnErrorInvocations = 0;

    // Called after every task error.
    el.a = 'a1';
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.equal(numOnErrorInvocations, 0);
    assert.equal(lastOnErrorResult, 'error');
    el.rejectTask('error2');
    await tasksUpdateComplete();
    assert.equal(el.task.status, TaskStatus.ERROR);
    assert.equal(numOnErrorInvocations, 1);
    assert.equal(lastOnErrorResult, 'error2');
  });

  test('no change-in-update warning', async () => {
    ReactiveElement.enableWarning?.('change-in-update');
    let numInvocations = 0;

    const el = getTestElement({
      args: () => [1],
      onComplete: () => {
        numInvocations++;
      },
    });
    await renderElement(el);
    el.resolveTask();
    await tasksUpdateComplete();
    assert.equal(numInvocations, 1);
    assert.equal(warnMessages.length, 0);
  });

  test('Tasks can see effects of willUpdate()', async () => {
    class TestElement extends ReactiveElement {
      task = new Task(this, {
        args: () => [],
        task: () => {
          this.taskObservedValue = this.value;
        },
      });
      value = 'foo';
      taskObservedValue: string | undefined = undefined;

      override willUpdate() {
        this.value = 'bar';
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.appendChild(el);
    await el.updateComplete;
    await el.task.taskComplete;

    assert.equal(el.taskObservedValue, 'bar');
  });

  test('Elements only render once for pending tasks', async () => {
    let resolveTask: (v: unknown) => void;
    let renderCount = 0;
    class TestElement extends ReactiveElement {
      task = new Task(this, {
        args: () => [],
        task: () => new Promise((res) => (resolveTask = res)),
      });

      override update(changedProperties: PropertyValues) {
        super.update(changedProperties);
        renderCount++;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.appendChild(el);
    // The first update will trigger the task
    await el.task.taskComplete;
    assert.equal(renderCount, 1);
    assert.equal(el.task.status, TaskStatus.PENDING);

    // The task starting should not trigger another update
    await el.updateComplete;
    assert.equal(renderCount, 1);
    assert.equal(el.task.status, TaskStatus.PENDING);

    // But the task completing should
    resolveTask!(undefined);
    // TODO (justinfagnani): Awaiting taskComplete and updateComplete is
    // similar in function to await tasksUpdateComplete(), but more accurate
    // due to not relying on a rAF. We should update all the tests.
    await el.task.taskComplete;
    await el.updateComplete;
    assert.equal(renderCount, 2);
    assert.equal(el.task.status, TaskStatus.COMPLETE);
  });

  test('Tasks can depend on host rendered DOM', async () => {
    LitElement.enableWarning?.('change-in-update');
    class TestElement extends LitElement {
      task = new Task(this, {
        args: () => [this.foo],
        task: async ([foo]) => foo,
        autoRun: 'afterUpdate',
      });

      @query('#foo')
      foo?: HTMLElement;

      override render() {
        console.log('render');
        return html`<div id="foo"></div>`;
      }
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.appendChild(el);
    await el.updateComplete;
    await el.task.taskComplete;

    assert.ok(el.task.value);
    assert.equal(el.task.status, TaskStatus.COMPLETE);
    // Make sure we avoid change-in-update warnings
    assert.equal(warnMessages.length, 0);
  });

  test('generates a new taskComplete promise on run vs initial', async () => {
    class TestElement extends ReactiveElement {
      task = new Task(this, {
        task: async () => {
          // Use crypto.randomUUID when it's supported in our sauce targets.
          return Math.random() * 1000000;
        },
        autoRun: false,
      });
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.appendChild(el);
    await el.updateComplete;

    const initialTaskComplete = el.task.taskComplete;
    assert.equal(el.task.status, TaskStatus.INITIAL);
    assert.isTrue(initialTaskComplete instanceof Promise);

    const initialValue = await initialTaskComplete;
    assert.equal(el.task.value, initialValue);

    el.task.run();

    assert.equal(el.task.status, TaskStatus.PENDING);
    const pendingTaskComplete = el.task.taskComplete;
    assert.notEqual(pendingTaskComplete, initialTaskComplete);

    const nextValue = await pendingTaskComplete;

    assert.equal(el.task.status, TaskStatus.COMPLETE);

    const completedTaskComplete = el.task.taskComplete;

    assert.equal(completedTaskComplete, pendingTaskComplete);

    await el.task.taskComplete;

    assert.equal(nextValue, el.task.value);
  });

  test('generates a new taskComplete promise on subsequent runs', async () => {
    class TestElement extends ReactiveElement {
      task = new Task(this, {
        task: async () => {
          return Math.random() * 1000000;
        },
        autoRun: false,
      });
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.appendChild(el);
    await el.updateComplete;

    el.task.run();

    assert.equal(el.task.status, TaskStatus.PENDING);
    const pendingTaskComplete = el.task.taskComplete;

    await pendingTaskComplete;

    assert.equal(el.task.status, TaskStatus.COMPLETE);

    const nextTaskComplete = el.task.taskComplete;

    assert.equal(nextTaskComplete, pendingTaskComplete);

    el.task.run();

    const subsequentTaskComplete = el.task.taskComplete;

    assert.equal(el.task.status, TaskStatus.PENDING);
    assert.notEqual(subsequentTaskComplete, pendingTaskComplete);
  });

  test('task does not throw if no taskComplete has been initiated', async () => {
    class TestElement extends ReactiveElement {
      task = new Task(this, {
        task: async () => {
          throw new Error(
            'If you see this in the console, this test is broken.'
          );
        },
        autoRun: false,
      });
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.appendChild(el);
    await el.updateComplete;

    await el.task.run();
  });

  test('rejects after erroring task completes', async () => {
    class TestElement extends ReactiveElement {
      task = new Task(this, {
        task: async () => {
          throw new Error(
            'If you see this in the console, this test is broken.'
          );
        },
        autoRun: false,
      });
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.appendChild(el);
    await el.updateComplete;

    await el.task.run();

    assert.equal(el.task.status, TaskStatus.ERROR);

    let error: Error | undefined;
    await el.task.taskComplete.catch((e: Error) => {
      error = e;
    });

    assert.isTrue(error !== undefined);
  });

  test('can catch error on taskComplete', async () => {
    class TestElement extends ReactiveElement {
      task = new Task(this, {
        task: async () => {
          throw new Error(
            'If you see this in the console, this test is broken.'
          );
        },
        autoRun: false,
      });
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.appendChild(el);
    await el.updateComplete;

    el.task.run();

    let error: Error | undefined = undefined;

    await el.task.taskComplete.catch((e: Error) => {
      error = e;
    });

    assert.isTrue(error !== undefined);
    assert.equal(el.task.status, TaskStatus.ERROR);
  });

  test('reuses taskComplete promise in the middle of runs', async () => {
    class TestElement extends ReactiveElement {
      task = new Task(this, {
        task: async () => {
          return Math.random() * 1000000;
        },
        autoRun: false,
      });
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.appendChild(el);
    await el.updateComplete;

    el.task.run();

    assert(el.task.status === TaskStatus.PENDING);
    const firstTaskComplete = el.task.taskComplete;
    assert.isTrue(firstTaskComplete instanceof Promise);

    el.task.run();
    assert(el.task.status === TaskStatus.PENDING);
    const secondTaskComplete = el.task.taskComplete;

    assert.equal(secondTaskComplete, firstTaskComplete);

    await secondTaskComplete;

    assert.equal(el.task.status, TaskStatus.COMPLETE);

    const completeTaskComplete = el.task.taskComplete;

    assert.equal(completeTaskComplete, secondTaskComplete);
  });

  test('subsequent resolve runs do not return same value', async () => {
    class TestElement extends ReactiveElement {
      task = new Task(this, {
        task: async () => {
          return Math.random() * 1000000;
        },
        autoRun: false,
      });
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();
    container.appendChild(el);
    await el.updateComplete;

    await el.task.run();

    const firstValue = await el.task.taskComplete;
    assert.equal(el.task.value, firstValue);

    await el.task.run();

    const secondValue = await el.task.taskComplete;

    assert.equal(el.task.value, secondValue);
    assert.notEqual(firstValue, secondValue);
  });

  test('type-only render return type test', () => {
    class TestElement extends ReactiveElement {
      task = new Task(this, () => 'abc');
    }
    customElements.define(generateElementName(), TestElement);
    const el = new TestElement();

    const accept = <T>(x: T) => x;

    accept<number | undefined>(el.task.render({initial: () => 123}));
    accept<number | undefined>(el.task.render({complete: () => 123}));
    accept<number | undefined>(el.task.render({pending: () => 123}));
    accept<number | undefined>(el.task.render({error: () => 123}));
    accept<number | undefined>(
      el.task.render({initial: () => 123, complete: () => 123})
    );

    accept<number>(
      el.task.render({
        initial: () => 123,
        complete: () => 123,
        pending: () => 123,
        error: () => 123,
      })
    );
    accept<number>(
      el.task.render({
        initial: () => 123,
        complete: (value) => Number(accept<string>(value)),
        pending: () => 123,
        error: (error) => (error instanceof Error ? 123 : 456),
      })
    );
  });
});
