import { virtualizerRef } from '@lit-labs/virtualizer/VirtualScroller.js';

const targetFPS = 60;
const t = 1000 / targetFPS;

export function runBenchmark(virtualizerNodeOrQuery, distance=10000, duration=5000, delay=1000) {
    let virtualizer, scrolled, scrollTo, start;
    let frames = 0;

    function onFrame() {
        frames++;
        const stamp = window.performance.now();
        if (start === undefined) {
            start = stamp;
        }
        const elapsed = stamp - start;
        if (scrolled() < distance || elapsed < duration) {
            scrollTo(Math.min(distance, Math.ceil(elapsed / duration * distance)));
            setTimeout(onFrame, t);
        }
        else {
            const fps = Math.floor(1000 / ((stamp - start) / frames));
            const { timeElapsed, virtualizationTime } = virtualizer.stopBenchmarking();
            const normalized = virtualizationTime / timeElapsed * duration;
            console.log(JSON.stringify({
                fps,
                timeElapsed,
                virtualizationTime,
                normalized
            }, null, 2));
            window.tachometerResult = normalized;
        }
    }

    setTimeout(function() {
        virtualizer = getVirtualizer(virtualizerNodeOrQuery);
        // TODO (graynorton): support horizontal?
        const target = virtualizer._clippingAncestors[0] || window;
        if (target === window) {
            scrolled = () => target.pageYOffset;
            scrollTo = y => target.scrollTo(0, y);
        } else {
            scrolled = () => target.scrollTop;
            scrollTo = y => target.scrollTop = y;
        }
        virtualizer.startBenchmarking();
        setTimeout(onFrame, t);
    }, delay);
}

function getSearchParams() {
    const params = {};
    if (window.location.search) {
        const paramsArray = window.location.search.substr(1).split('&');
        paramsArray.forEach(param => {
            const parts = param.split('=');
            params[parts[0]] = parts[1] || true;
        });
    }
    return params;
}

export function runBenchmarkIfRequested(virtualizerNodeOrQuery) {
    setTimeout(() => {
        const { benchmark, distance, duration, delay } = getSearchParams();
        registerVirtualizer(virtualizerNodeOrQuery);
        if (benchmark) {
            runBenchmark(virtualizerNodeOrQuery, distance, duration, delay);
        }    
    }, 0);
}

function getVirtualizer(nodeOrQuery) {
    const node = nodeOrQuery instanceof HTMLElement
        ? nodeOrQuery
        : document.querySelector(nodeOrQuery);
    if (!node) {
        throw new Error(`Virtualizer not found: ${virtualizerNodeOrQuery}`);
    }
    return node[virtualizerRef];
}

export function registerVirtualizer(virtualizerNodeOrQuery) {
    const virtualizer = getVirtualizer(virtualizerNodeOrQuery);
    if (virtualizer) {
        const virtualizers = window.virtualizers || (window.virtualizers = []);
        if (!virtualizers.find(v => v === virtualizer)) {
            virtualizers.push(virtualizer);
        }
    }
}