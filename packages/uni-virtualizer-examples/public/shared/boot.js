if (typeof Promise === 'undefined') {
    addScript('/node_modules/bluebird/js/browser/bluebird.core.js');
}
if (typeof fetch === 'undefined') {
    addScript('/node_modules/whatwg-fetch/dist/fetch.umd.js');
}

if (supportsDynamicImport()) {
    var example = document.createElement('script');
    example.src = './build/es/index.js';
    example.type = 'module';
    document.head.appendChild(example);
}
else {
    addScript('/node_modules/systemjs/dist/s.min.js');

    var loadFiles = supportsAsync() ? loadSystem : loadSystemTranspiled;

    (function load() {
        console.log('load');
        if (window.System) {
            loadFiles();    
        }
        else {
            setTimeout(load, 0);
        }
    })();
    
    function loadSystem() {
        window.System.import('./build/system/index.js');    
    }
    
    function loadSystemTranspiled() {
        window.System.import('../shared/build/system-transpiled/babel-polyfills.js');
        window.System.import('./build/system-transpiled/index.js');    
    }
}

function addScript(src) {
    const script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
}

// function supportsStaticImport() {
//     const script = document.createElement('script');
//     return 'noModule' in script; 
// }

function supportsDynamicImport() {
    try {
      new Function('import("")');
      return true;
    } catch (err) {
      return false;
    }
}

function supportsAsync() {
    try {
      eval('async () => {}');
    } catch (e) {
      if (e instanceof SyntaxError)
        return false;
      else
        throw e; // throws CSP error
    }
    return true;
}

// const unbundled = window.location.search.substr(1) === 'unbundled';
// const pathToExample = unbundled ? './index.js' : './build/module/index.js';

// (async function boot() {
//     if (unbundled) {
//         const importmap = document.createElement('script');
//         importmap.setAttribute('type', 'importmap');
//         importmap.textContent = await (await fetch('../shared/importmap.json')).text();
//         document.head.appendChild(importmap);
//     }
//     const example = document.createElement('script');
//     example.src = pathToExample;
//     example.type = 'module';
//     document.head.appendChild(example);
// })();