const {defineConfig} = require('vite');

module.exports = defineConfig({
  plugins: [
    {
      configureServer(server) {
        const fsWatcher = server.watcher;
        server.ws.on('connection', (socket) => {
          socket.on('message', (data) => {
            console.log(data);
            console.log(String(data));
          });
        });
      },
      load(absFilePath) {},
    },
  ],
});
