(function (karma) {
  const files = Object.keys(karma.files).filter(f => f.endsWith('_test.js'));
  const promises = files.map(js => new Promise(resolve => {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = js;
    s.onload = resolve;
    document.head.appendChild(s);
  }));

  const origLoaded = karma.loaded.bind(karma);
  karma.loaded = _ => {};

  Promise.all(promises)
    .then(_ => {
      origLoaded();
    });
})(__karma__);
