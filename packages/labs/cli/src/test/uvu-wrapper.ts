import * as uvu from 'uvu';

const IN_CI = process.env['CI'];
// CI machines are sometimes super slow, so give them plenty of time.
const TIMEOUT = IN_CI ? 60_000 : 1_000;

/**
 * A safer wrapper around uvu.suite.
 *
 * Adds a timeout so that the the test doesn't hang forever, and so that it
 * can't be garbage collected.
 *
 * Automatically calls `run` as well.
 */
export function suite<T>(opts?: {timeout?: number}): uvu.Test<T> {
  const timeoutMs = opts?.timeout ?? TIMEOUT;
  const testBase = uvu.suite<T>();
  const wrapped: uvu.Test<T> = ((name: string, impl: uvu.Callback<T>) => {
    return testBase(name, timeout(name, timeoutMs, impl));
  }) as unknown as uvu.Test<T>;
  for (const [key, value] of Object.entries(testBase)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wrapped as any)[key] = value;
  }
  // Automatically run the tests after waiting for them to be registered.
  setTimeout(() => {
    wrapped.run();
  }, 0);
  return wrapped;
}

/**
 * We don't actually care that much about timing out, this is mainly to work
 * around
 * https://github.com/lukeed/uvu/issues/206
 */
function timeout<T>(
  name: string,
  ms: number,
  test: uvu.Callback<T>
): uvu.Callback<T> {
  return async (ctx) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const result = Promise.race([
      test(ctx),
      new Promise<void>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Test timed out: ${JSON.stringify(name)}`)),
          ms
        );
      }),
    ]);
    result.finally(() => {
      clearTimeout(timeoutId);
    });
    return result;
  };
}
