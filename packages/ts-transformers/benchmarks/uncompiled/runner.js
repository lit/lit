/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const queryParams = document.location.search
    .slice(1)
    .split('&')
    .filter((s) => s)
    .map((p) => p.split('='))
    .reduce((p, [k, v]) => ((p[k] = (() => {
    try {
        return JSON.parse(v);
    }
    catch {
        return v || true;
    }
})()),
    p), {});
// Settings
const itemCount = 250;
const itemValueCount = 99;
const updateCount = 6;
function makeItem(prefix) {
    const o = {};
    for (let i = 0; i < itemValueCount; i++) {
        o['value' + i] = prefix + ': ' + i;
    }
    return o;
}
function generateData(count) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push(makeItem(i));
    }
    return data;
}
const data = generateData(itemCount);
const otherData = generateData(itemCount * 2).slice(itemCount);
export const runBenchmark = async (renderApp) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const destroy = () => {
        container.innerHTML = '';
    };
    const benchmark = queryParams['benchmark'];
    const getTestStartName = (name) => `${name}-start`;
    // Named functions are use to run the measurements so that they can be
    // selected in the DevTools profile flame chart.
    // Initial Render
    const initialRender = async () => {
        const test = 'render';
        if (benchmark === test || !benchmark) {
            const start = getTestStartName(test);
            performance.mark(start);
            await renderApp(data);
            performance.measure(test, start);
            destroy();
        }
    };
    await new Promise((r) => setTimeout(r, 100));
    await initialRender();
    // Update: toggle data
    const update = async () => {
        const test = 'update';
        if (benchmark === test || !benchmark) {
            await renderApp(data);
            const start = getTestStartName(test);
            performance.mark(start);
            for (let i = 0; i < updateCount; i++) {
                await renderApp(i % 2 ? otherData : data);
            }
            performance.measure(test, start);
            destroy();
        }
    };
    await update();
    // Log
    performance.getEntriesByType('measure').forEach((m) => {
        console.log(`${m.name}: ${m.duration.toFixed(3)}ms`);
        window.tachometerResult =
            m.duration;
    });
};
//# sourceMappingURL=runner.js.map