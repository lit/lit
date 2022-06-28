/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

const fs = require('fs');

module.exports = () => {
  const customElements = JSON.parse(
    fs.readFileSync('custom-elements.json', 'utf-8')
  );
  return {
    customElements,
  };
};
