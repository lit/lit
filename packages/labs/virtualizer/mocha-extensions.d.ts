declare module 'mocha' {
  interface SuiteFunction {
    skipInCI(title: string, fn?: (this: Mocha.Suite) => void): Mocha.Suite;
  }
}

export {};
