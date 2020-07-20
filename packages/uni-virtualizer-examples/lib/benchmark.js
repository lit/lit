import { scrollerRef } from 'lit-virtualizer';

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
            window.requestAnimationFrame(onFrame);
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
        const node = scrollerNodeOrQuery instanceof HTMLElement
            ? scrollerNodeOrQuery
            : document.querySelector(scrollerNodeOrQuery);
        if (!node) {
            throw new Error(`Scroller not found: ${scrollerNodeOrQuery}`);
        }
        scroller = node[scrollerRef];
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
        window.requestAnimationFrame(onFrame);
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

export function runBenchmarkIfRequested(scrollerQuery) {
    const { benchmark, distance, duration, delay } = getSearchParams();
    if (benchmark) {
        runBenchmark(scrollerQuery, distance, duration, delay);
    }
}