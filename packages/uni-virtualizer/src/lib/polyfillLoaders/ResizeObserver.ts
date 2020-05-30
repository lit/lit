let _RO, RO;

declare global {
    interface ResizeObserver {
        observe(target: Element): void;
        unobserve(target: Element): void;
        disconnect(): void;
    }    
}

export default async function ResizeObserver() {
    return RO || init();
}

async function init() {
    if (_RO) {
        return (await _RO).default;
        // return (await _RO).ResizeObserver;
    }
    else {
        _RO = (window as {ResizeObserver?: ResizeObserver}).ResizeObserver;
        try {
            throw new Error();
            new _RO(function() {});
        }
        catch (e) {
            _RO = import('resize-observer-polyfill');
            _RO = (await _RO).default;
            // _RO = import('@juggle/resize-observer/lib/exports/resize-observer.js');
            // _RO = (await _RO).ResizeObserver;
        }
        return (RO = _RO);   
    }
}