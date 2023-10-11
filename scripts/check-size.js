import * as fs from 'fs';

// Is your PR failing because sizes changed?
//
// Is the new size smaller? Congratulations, that's worth celebrating in your
// changeset description!
//
// If it's bigger, be aware that we're very sensitive to size increases, and
// it's likely that we'll ask you to investigate ways to reduce the size.
//
// In either case, update the size here and push a new commit to your PR.
const expectedLitCoreSize = 15423;
const expectedLitHtmlSize = 7250;

const litCoreSrc = fs.readFileSync('packages/lit/lit-core.min.js', 'utf8');
const litCoreSize = fs.readFileSync('packages/lit/lit-core.min.js').byteLength;

const litHtmlSrc = fs.readFileSync('packages/lit-html/lit-html.js', 'utf8');
const litHtmlSize = fs.readFileSync('packages/lit-html/lit-html.js').byteLength;

const reportProblem = (() => {
  const outFile = fs.createWriteStream('scripts/check-size-out.md', 'utf8');
  /** @param {string} markdown */
  return (markdown) => {
    // eslint-disable-next-line no-undef
    process.exitCode = 1;
    console.log(markdown + '\n');
    outFile.write(markdown + '\n\n');
  };
})();

if (
  /end render|template instantiated/.test(litCoreSrc) ||
  /end render|template instantiated/.test(litHtmlSrc)
) {
  reportProblem(
    `The \`debugLogEvent\` function isn't being dead code eliminated. This will likely greatly increase binary size. We depend on terser for this, and its dead code elimination can be a bit finicky.`
  );
}

if (litCoreSize !== expectedLitCoreSize) {
  if (litCoreSize < expectedLitCoreSize) {
    reportProblem(`This is a size improvement! It shaves **${
      expectedLitCoreSize - litCoreSize
    }** bytes off lit-core.min.js which is ${expectedLitCoreSize.toLocaleString()}B at head. Congratulations!

Please update \`expectedLitCoreSize\` to ${litCoreSize} in \`scripts/check-size.js\` and push a new commit to your PR.`);
  } else {
    reportProblem(
      `**This is a size regression**. It adds **${
        litCoreSize - expectedLitCoreSize
      }** bytes to lit-core.min.js which is ${expectedLitCoreSize.toLocaleString()}B at head. We're very sensitive to size increases. If this is intended, please update \`expectedLitCoreSize\` to ${litCoreSize} in \`scripts/check-size.js\` and push a new commit to your PR.`
    );
  }
}

if (litHtmlSize !== expectedLitHtmlSize) {
  if (litHtmlSize < expectedLitHtmlSize) {
    reportProblem(`This is a size improvement! It shaves **${
      expectedLitHtmlSize - litHtmlSize
    }** bytes off lit-html.js which is ${expectedLitHtmlSize.toLocaleString()}B at head. Congratulations!

Please update \`expectedLitHtmlSize\` to ${litHtmlSize} in \`scripts/check-size.js\` and push a new commit to your PR.`);
  } else {
    reportProblem(
      `**This is a size regression**. It adds **${
        litHtmlSize - expectedLitHtmlSize
      }** bytes to lit-html.js which is ${expectedLitHtmlSize.toLocaleString()}B at head. We're very sensitive to size increases. If this is intended, please update \`expectedLitHtmlSize\` to ${litHtmlSize} in \`scripts/check-size.js\` and push a new commit to your PR.`
    );
  }
}
