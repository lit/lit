(function() {

  let measuring = false;

  // x-browser compat.
  if (!window.performance) {
    var start = Date.now();
    // only at millisecond precision
    window.performance = {now: function(){ return Date.now() - start }};
  }

  console.perf = function() {
    if (!measuring) {
      measuring = true;
      if (window.gc) {
        for (var i=0; i<20; i++) {
          gc();
        }
      }
      if (console.time) {
        console.time('perf');
      }
      console.profile();
      console.perf.time = performance.now();
    }
  };

  console.perfEnd = function(info) {
    if (!measuring) {
      throw new Error('perfEnd() called before perf()')
    }
    measuring = false;
    // force layout
    document.body.offsetWidth;
    var time = performance.now() - console.perf.time;
    console.profileEnd();
    if (console.time) {
      console.timeEnd('perf');
    }
    document.title = time.toFixed(1) + 'ms: ' + document.title;
    if (window.top !== window) {
      window.top.postMessage({time: time + 'ms', info: info}, '*');
    }
  };
})();