let ET;

export default async function EventTarget() {
    return ET || init();
}

async function init() {
    ET = window.EventTarget;
    try {
        new ET();
    }
    catch {
        ET = (await import('event-target-shim')).EventTarget;
    }
    return ET;
}