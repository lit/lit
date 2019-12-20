const header = require('./header.11ty.cjs');
const footer = require('./footer.11ty.cjs');
const nav = require('./nav.11ty.cjs');

module.exports = function(data) {
  return `
<!doctype html>

<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <link rel="stylesheet" href="/docs.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600|Roboto+Mono">
    <link href="/prism-okaidia.css" rel="stylesheet" />
    <script type="module" src="/my-element.bundled.js"></script>
  </head>
  <body>
    ${header()}
    ${nav(data)}
    <div id="main-wrapper">
      <main>
        ${data.content}
      </main>
    </div>
    ${footer()}
  </body>
</html>`;
};
