let _ET, ET;

export default async function EventTarget() {
    return ET || init();
}

async function init() {
    _ET = (window as {EventTarget?: EventTarget}).EventTarget;
    try {
        new _ET();
    }
    catch {
        _ET = (await import('event-target-shim')).EventTarget;
    }
    return (ET = _ET);
}