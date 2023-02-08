const {esbuildPlugin} = require('@web/dev-server-esbuild');
const {hmrPlugin} = require('@web/dev-server-hmr');
const {getRequestFilePath} = require('@web/dev-server-core');
const path = require('path');

module.exports = {
  plugins: [
    // {
    //   serverStart({config, fileWatcher}) {
    //     this.config = config;
    //     console.log(path.resolve('./src/test/demo.ts'));
    //     setInterval(() => {
    //       fileWatcher.emit('change', path.resolve('./src/test/demo.ts'));
    //     }, 1000);
    //   },
    //   count: 0,
    //   transform(context) {
    //     const path = getRequestFilePath(context.url, this.config.rootDir);
    //     if (!path.endsWith('demo.ts')) {
    //       return;
    //     }
    //     console.log('boop!');
    //     // return `document.body.textContent = 'Hello World ${++this.count}'`;
    //   },
    // },
    esbuildPlugin({ts: true, target: 'es2020'}),
    hmrPlugin(),
  ],
  nodeResolve: {
    exportConditions: ['development'],
  },
  open: '/src/test/demo.html',
};
