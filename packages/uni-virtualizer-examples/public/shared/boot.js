const unbundled = window.location.search.substr(1) === 'unbundled';
const pathToExample = unbundled ? './index.js' : './build/index.js';

async function boot() {
    if (unbundled) {
        const importmap = document.createElement('script');
        importmap.setAttribute('type', 'importmap');
        importmap.textContent = await (await fetch('../shared/importmap.json')).text();
        document.head.appendChild(importmap);
    }
    const example = document.createElement('script');
    example.src = pathToExample;
    example.type = 'module';
    document.head.appendChild(example);
}

boot();