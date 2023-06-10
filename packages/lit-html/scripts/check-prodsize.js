import * as fs from 'fs';

const expectedMaxSize = 7220;

const litHtmlSrc = fs.readFileSync('lit-html.js', 'utf8');

if (/end render|template instantiated/.test(litHtmlSrc)) {
  // eslint-disable-next-line no-undef
  process.exitCode = 1;
  console.log(`debugLogEvent isn't being dead code eliminated`);
}

const litHtmlBytes = fs.readFileSync('lit-html.js').byteLength;

if (litHtmlBytes !== expectedMaxSize) {
  // eslint-disable-next-line no-undef
  process.exitCode = 1;
  console.log(
    `unexpected size increase in prod build of lit-html.js. size was ${litHtmlBytes} but expected it to be no bigger than ${expectedMaxSize}`
  );
}
