let ET;

export default async function EventTarget() {
    return ET || init();
}

async function init() {
    ET = (window as {EventTarget?: EventTarget}).EventTarget;
    try {
        new ET();
    }
    catch {
        ET = (await import('event-target-shim')).EventTarget;
    }
    return ET;
}