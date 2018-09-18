
customElements.define('frame-tester', class extends HTMLElement {

  connectedCallback() {
    this.innerHTML = `
      <style>

        frame-tester {
          display: block;
          font-family: sans-serif;
          overflow: hidden;
        }

        frame-tester iframe {
          position: absolute;
          border: 0;
          width: 100vw;
          height: 100vh;
          left: -100vw;
          top: -100vh;
          visibility: hidden;
          xdisplay: none;
        }

        frame-tester o, frame-tester n {
          display: inline-block;
          xwidth: 24px;
          margin: 2px;
          text-align: right;
          font-family: monospace;
        }

        frame-tester o {
          color: rgba(255, 0, 0, 0.5);
        }

        frame-tester n {
          display: inline-block;
          color: green;
          font-weight: bold;
        }

        frame-tester .card {
          padding: 16px;
          box-shadow: 0 8px 10px 1px rgba(0, 0, 0, 0.14),
                      0 3px 14px 2px rgba(0, 0, 0, 0.12),
                      0 5px 5px -3px rgba(0, 0, 0, 0.4);
          margin: 16px;
          overflow: hidden;
          background-color: #fff;
        }

        frame-tester #chartmin,
        frame-tester #chartmax {
          width: 40px;
        }

      </style>
      <label><input type="checkbox" id="showCharts">Show histograms</label>
      <span id="chartOpts">
        <input type="number" placeholder="min" id="chartmin"> ~
        <input type="number" placeholder="max" id="chartmax">
      </span>
    
      <div id="log"></div>
    `;
    this.frame = this.querySelector('#frame');
    this.log = this.querySelector('#log');
    this.strategy = this.strategies.minimum;
    this.attributeChangedCallback('strategy', null, this.getAttribute('strategy'));
    this.attributeChangedCallback('runs', null, this.getAttribute('runs') || 25);
    this.attributeChangedCallback('base', null, this.getAttribute('base') || '');
    this.attributeChangedCallback('chart', null, this.hasAttribute('chart') ? true : null);
    this.attributeChangedCallback('chartmin', null, this.getAttribute('chartmin') || 140);
    this.attributeChangedCallback('chartmax', null, this.getAttribute('chartmax') || 270);
    window.addEventListener('message', this.scoreMessage.bind(this));
    var self = this;
    this.querySelector('#showCharts').addEventListener('change', function(e) {
      self.chart = e.target.checked;
    });
    this.querySelector('#chartmin').addEventListener('input', function(e) {
      self.chartmin = e.target.valueAsNumber;
    });
    this.querySelector('#chartmax').addEventListener('input', function(e) {
      self.chartmax = e.target.valueAsNumber;
    });
  }
  attributeChangedCallback(name, old, value) {
    switch(name) {
      case 'runs':
        this.runs = value;
        break;
      case 'base':
        this.base = value;
        break;
      case 'strategy':
        this.strategy = this.strategies[value] || this.strategy;
        break;
      case 'chart':
        this.chart = value != null;
      case 'chartmin':
        this.chartmin = value;
      case 'chartmax':
        this.chartmax = value;
    }
  }
  get tests() {
    return this._tests;
  }

  set tests(value) {
    this._tests = value;
    this.go();
  }

  set chart(value) {
    this._chart = value;
    this.querySelector('#showCharts').checked = value;
    this.querySelector('#chartOpts').hidden = !value;
    if (value && !this._chartLoaded) {
      this._chartLoaded = true;;
      var script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      var self = this;
      script.onload = function() {
        google.charts.load("current", {packages:["corechart"]});
        google.charts.setOnLoadCallback(function() {
          self._shouldDrawChart = self._chart;
          self.drawCharts();
        });
      }
      script.onerror = function(e) { console.error('couldn\'t load chart lib: ' + e); };
      document.head.appendChild(script);
    } else {
      this._shouldDrawChart = value;
    }
    if (this.tests) {
      this.report();
    }
  }

  get chart() {
    return this._chart
  }

  set chartmin(value) {
    this._chartmin = value;
    this.querySelector('#chartmin').value = value;
    this.drawCharts();
  }
  
  get chartmin() { return this._chartmin }

  set chartmax(value) {
    this._chartmax = value;
    this.querySelector('#chartmax').value = value;
    this.drawCharts();
  }
  
  get chartmax() { return this._chartmax }

  shuffle(tests) {
    var shuffled = [];
    var ordered = tests.slice(0);
    var count = ordered.length;
    for (var i=0, j; i<count; i++) {
      j = Math.floor(Math.random()*count);
      // TODO(sjmiles): this is an easy but poorly randomized distribution
      for (; !ordered[j]; j = (j + 1) % count);
      shuffled.push(j);
      ordered[j] = null;
    }
    return shuffled;
  }

  go() {
    this.count = 0;
    this.total = [];
    this.times = [];
    this.infos = [];
    for (var i=0; i<this.tests.length; i++) {
      this.total[i] = 0;
      this.times[i] = [];
    }
    this.startRun();
  }

  startRun() {
    this.shuffled = this.shuffle(this.tests);
    this.index = -1;
    //console.group('run', this.count);
    this.nextTest();
  }

  nextTest() {
    // last test in this run?
    if (++this.index === this.tests.length) {
      //console.groupEnd();
      // report results
      ++this.count;
      this.report();
      // more runs?
      if (this.count < this.runs) {
        this.startRun();
      } else {
        // all done!
        this.dispatchEvent(new CustomEvent('done'));
      }
      return;
    }
    // test order is randomized
    this.test = this.shuffled[this.index];
    if (this.frame) {
      this.removeChild(this.frame);
    }
    this.frame = document.createElement('iframe');
    this.appendChild(this.frame);
    this.frame.src = this.base + this.tests[this.test];
    // it's possible for a test to end before the load event fires,
    // so assume the frame loads immediately and start waiting
    // for a result.
    this.load();
  }

  load() {
    // frame is loaded, measure the time, then proceed
    this.measure(function(info) {
      this.record(info);
      this.nextTest();
    });
  }

  measure(next) {
    this.afterScore = next;
  }

  scoreMessage(e) {
    if (this.afterScore) {
      var info = e.data;
      if (typeof info !== 'object') {
        info = {time: info};
      }
      info.time = parseInt(info.time);
      this.afterScore(info);
    }
  }

  record(info) {
    //console.log('index [%d], test [%d] time [%d]', this.index, this.test, time);
    if (!this.infos[this.test]) {
      this.infos[this.test] = info;
    }
    this.times[this.test].push(info.time);
    this.total[this.test] += info.time;
  }

  report() {
    var info = '<br>Runs: ' + this.count + '/' + this.runs
      + '<br><br>';
    //
    for (var i=0, baseline; i<this.tests.length; i++) {
      var url = this.tests[i],
          total = this.total[i],
          times = this.times[i],
          testInfo = this.infos[i];
      //
      var timeInfo = this.calcScores(times, baseline);
      if (i == 0) {
        baseline = timeInfo;
      }
      //
      var timeReport = '';
      var stats = null;
      for (var kind in timeInfo) {
        var stratInfo = timeInfo[kind];
        timeReport += (stratInfo.time).toFixed(1) + 'ms' + ' (' + stratInfo.compare +'%) ';
        if (!stats) {
          stats = stratInfo.stats;
        }
      }
      var title = (testInfo && testInfo.info && testInfo.info.name) || url;
      info += '<div class="card">'
        + ' <b>' + timeReport + '</b>'
        + ' [stddev: ' + stats.deviation.toFixed(2) + ']'
        + ' &nbsp;&nbsp;&nbsp;<a href="' + this.base + url + '" target="_blank">' + title + '</a>'
        + '<br>'
        ;
      //
      info += '<span style="font-size: 8px; white-space: nowrap">';
      for (var j=0, v; v=times[j]; j++) {
        var o = stats.outlier(v);
        info += (o ? '<o>' : '<n>') + v.toFixed(0) + (o ? '</o>' : '</n>') + '|';
      }
      info += '</span>';
      info += '<div class="chart" id="chart' + i + '"></div>';
      info += '</div>';
    }
    //
    this.log.innerHTML = info;
    this.drawCharts();
  }

  drawCharts() {
    if (this._shouldDrawChart) {
      for (var i=0; i<this.tests.length; i++) {
        var data = [[this.tests[i]]].concat(this.times[i].map(function(t) { return [t] }));
        var table = google.visualization.arrayToDataTable(data);
        var options = {
          fontSize: 6,
          width: 400,
          chartArea: { width: 400, left: 0 },
          height: 75,
          bar: { gap: 0 },
          lastBucketPercentile: 5,
          legend: { position: 'none' },
          vAxis: { textPosition: 'none' },
          hAxis: { slantedText: false, viewWindow: {min: this._chartmin, max: this._chartmax} },
          histogram: {
            hideBucketItems: true,
            bucketSize: 2,
            maxNumBuckets: 200,
            minValue: this._chartmin,
            maxValue: this._chartmax
          }
        };
        var chart = new google.visualization.Histogram(this.querySelector('#chart' + i));
        chart.draw(table, options);
      }
    }
  }

  calcScores(times, baseline) {
    var info = {};
    times = times.slice();
    for (var kind in this.strategies) {
      var stats = this.stats(times, kind);
      var time = this.strategies[kind].score(times, stats, this);
      var compare = baseline ?
        ((time / baseline[kind].time - 1) * 100).toFixed(0) : 0;
      info[kind] = {time: time, compare: compare, stats: stats};
    }
    return info;
  }

  stats(a, kind) {
    var r = {mean: 0, variance: 0, deviation: 0}, t = a.length;
    for (var m, s = 0, l = t; l--; s += a[l]);
    for (m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2));
    r.outlier = this.strategies[kind].outlier;
    return r.deviation = Math.sqrt(r.variance = s / t), r;
  }

  //
  // selectable statical strategies
  //

  get strategies() {
    
    return {

      // This strategy selects the minimum timing for score.
      minimum: {
        score: function(times, stats) {
          var min = Number.MAX_VALUE;
          for (var j=0, v; v=times[j]; j++) {
            min = Math.min(v, min);
          }
          stats.score = min;
          return min;
        },
        // called in stats context
        outlier: function(value) {
          return value > this.score;
        }
      },

      median: {
        score: function(times, stats) {
          times.sort((a,b) => a - b);
          var middle = Math.floor(times.length / 2);
          stats.score = times[middle];
          return stats.score;
        },
        outlier: function(value) {
          return value != this.score;
        }
      },

      // This strategy selects the mean of all times not more than one stddev
      // away from the total sampling mean.
      onedev: {
        score: function(times, stats, context) {
          var cleaned = [];
          for (var j=0, v; v=times[j]; j++) {
            if (!stats.outlier(v)) {
              cleaned.push(v);
            }
          }
          return context.stats(cleaned, 'onedev').mean;
        },
        // called in stats context
        outlier: function(value) {
          return Math.abs(value - this.mean) > (1 * this.deviation);
        }
      }
    };
  }
});
