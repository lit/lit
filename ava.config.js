export default {
  files: ['lib/**/*.test.js'],
  // AVA watches all files for changes by default. Ignore src/ files so that we
  // wait for tsc before re-running tests.
  ignoredByWatcher: ['src/**/*'],
};
