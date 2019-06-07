import resolve from 'rollup-plugin-node-resolve';
const { readdirSync } = require('fs')

const builds = [];

// Create a build for each page in cases/.
const pages = readdirSync('./cases/');
for (let name of pages) {
  builds.push({
    input: `cases/${name}/main.js`,
    output: {
      dir: `cases/${name}/build`,
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]        
  });
}

export default builds;
