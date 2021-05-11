import { scrollerRef } from 'lit-virtualizer';

const targetFPS = 60;
const t = 1000 / targetFPS;

export function runBenchmark(scrollerNodeOrQuery, distance=10000, duration=5000, delay=1000) {
    let scroller, target, scrolled, scrollTo, start;
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
            const { timeElapsed, virtualizationTime } = scroller.stopBenchmarking();
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
        scroller = getScroller(scrollerNodeOrQuery);
        // TODO (graynorton): support horizontal?
        if (scroller.scrollTarget) {
            target = scroller.scrollTarget;
            scrolled = () => target.scrollTop;
            scrollTo = y => target.scrollTop = y;
        } else {
            target = window;
            scrolled = () => target.pageYOffset;
            scrollTo = y => target.scrollTo(0, y);
        }
        scroller.startBenchmarking();
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

export function runBenchmarkIfRequested(scrollerNodeOrQuery) {
    setTimeout(() => {
        const { benchmark, distance, duration, delay } = getSearchParams();
        registerScroller(scrollerNodeOrQuery);
        if (benchmark) {
            runBenchmark(scrollerNodeOrQuery, distance, duration, delay);
        }    
    }, 0);
}

function getScroller(nodeOrQuery) {
    const node = nodeOrQuery instanceof HTMLElement
        ? nodeOrQuery
        : document.querySelector(nodeOrQuery);
    if (!node) {
        throw new Error(`Scroller not found: ${scrollerNodeOrQuery}`);
    }
    return node[scrollerRef];
}

export function registerScroller(scrollerNodeOrQuery) {
    const scroller = getScroller(scrollerNodeOrQuery);
    if (scroller) {
        const scrollers = window.scrollers || (window.scrollers = []);
        if (!scrollers.find(s => s === scroller)) {
            scrollers.push(scroller);
        }
    }
}