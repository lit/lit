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
    }
    else {
        _RO = (window as unknown as {ResizeObserver?: ResizeObserver}).ResizeObserver;
        try {
            new _RO(function() {});
        }
        catch (e) {
            _RO = import('resize-observer-polyfill');
            _RO = (await _RO).default;
        }
        return (RO = _RO);   
    }
}