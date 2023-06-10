import * as fs from 'fs';

const expectedMaxSize = 14750;

const litHtmlSrc = fs.readFileSync('lit-core.min.js', 'utf8');

if (/end render|template instantiated/.test(litHtmlSrc)) {
  // eslint-disable-next-line no-undef
  process.exitCode = 1;
  console.log(`debugLogEvent isn't being dead code eliminated`);
}

const numBytes = fs.readFileSync('lit-core.min.js').byteLength;

if (numBytes !== expectedMaxSize) {
  // eslint-disable-next-line no-undef
  process.exitCode = 1;
  console.log(
    `unexpected size change in prod build of lit-core.min.js. size was ${numBytes}B but expected it to be ${expectedMaxSize}B

update packages/lit/scripts/check-prodsize.js if this change should change the size`
  );
}
