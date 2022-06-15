/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

type EventTargetModule = typeof import('event-target-shim');

interface EventTargetConstructor {
    new(): EventTarget
}

let _ET: EventTargetModule | EventTargetConstructor;
let ET: EventTargetConstructor;

export default async function EventTarget() {
    return ET || init();
}

async function init() {
    _ET = window.EventTarget;
    try {
        new _ET();
    }
    catch {
        _ET = (await import('event-target-shim')).EventTarget;
    }
    return (ET = _ET);
}
