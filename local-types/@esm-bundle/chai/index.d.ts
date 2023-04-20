// disable eslint for this file
/* eslint-disable */

// Temporary patch until https://github.com/esm-bundle/chai/pull/343 is merged
// and released
declare module '@esm-bundle/chai' {
  export {
    assert,
    expect,
    should,
    use,
    util,
    config,
    Assertion,
    AssertionError,
    version,
  } from 'chai';
}
