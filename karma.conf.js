module.exports = function(config) {
const configuration = {
    basePath: '',
    frameworks: ['mocha', 'chai'],
    files: [
      {
        pattern: 'lit-html.js',
        included: false,
      },
      {
        pattern: 'lib/**/*.js',
        included: false,
      },
      {
        pattern: 'test/lit-*.js',
        included: false,
      },
      {
        pattern: 'test/lib/**/*.js',
        included: false,
      },
      'test/runner.js',
    ],
    client: {
      mocha: {
        ui: 'tdd',
      },
    },
    preprocessors: {
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: true,
    concurrency: Infinity,
    browsers: ['ChromeCanaryHeadless'],
    customLaunchers: {
      ChromeCanaryHeadless: {
        base: 'ChromeCanary',
        /* Broken in today’s Canary. Should be working tomorrow? */
        flags: [/*'--headless'*/, '--disable-gpu'],
      },
    },
  };
  config.set(configuration);
};
