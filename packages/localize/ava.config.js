export default {
  files: ['lib/**/*.test.js'],
  // AVA watches all files in the repo for changes by default.
  ignoredByWatcher: [
    // Don't watch TypeScript source files, only the output of tsc.
    'src/**/*',
    // Don't watch generated test output files, or we'll get stuck in a loop.
    'testdata/*/output/**/*',
  ],
  timeout: '3m',
};
