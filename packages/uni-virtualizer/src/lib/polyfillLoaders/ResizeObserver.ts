import { ResizeObserverConstructor } from '../polyfills/resize-observer-polyfill/ResizeObserver.js';
type ResizeObserverModule = typeof import('../polyfills/resize-observer-polyfill/ResizeObserver.js');

let _RO: ResizeObserverModule | ResizeObserverConstructor;
let RO: ResizeObserverConstructor;

export default async function ResizeObserver() {
    return RO || init();
}

async function init() {
    if (_RO) {
        return (await _RO as ResizeObserverModule).default;
    }
    else {
        _RO = window.ResizeObserver;
        try {
            new _RO(function() {});
        }
        catch (e) {
            _RO = import('../polyfills/resize-observer-polyfill/ResizeObserver.js') as unknown as ResizeObserverModule;
            _RO = (await _RO).default;
        }
        return (RO = _RO);   
    }
}