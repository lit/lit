let RO;

export default async function ResizeObserver() {
    return RO || init();
}

async function init() {
    RO = window.ResizeObserver;
    try {
        new RO(function(){});
    }
    catch (e) {
        RO = (await import('resize-observer-polyfill')).default;
    }
    return RO;
}