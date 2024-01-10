/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

let containers: HTMLDivElement[] = [];

export function createContainer() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  return container;
}

/**
 * Cleans up previous created fixtures from the document. Call this after each
 * test if you wish to remove created fixture.
 */
export function cleanupFixtures() {
  containers.forEach((container) => container.remove());
  containers = [];
}
