/**
 * MIT license
 */

// Callback index.
var count = 0;

/**
 * JSONP handler
 *
 * Options:
 * - prefix {String} callback prefix (defaults to `__jp`)
 * - param {String} qs parameter (defaults to `callback`)
 * - timeout {Number} how long after the request until a timeout error
 *   is emitted (defaults to `15000`)
 *
 * @param {String} url
 * @param {Object} options optional options
 * @return {Object} Returns a response promise and a cancel handler.
 */
export function jsonp(url, options) {
  options = options || {};

  var prefix = options.prefix || '__jp';
  var param = options.param || 'callback';
  var timeout = options.timeout ? options.timeout : 15000;
  var target = document.getElementsByTagName('script')[0] || document.head;
  var script;
  var timer;
  var cleanup;
  var cancel;
  var promise;
  var noop = function() {};

  // Generate a unique id for the request.
  var id = prefix + (count++);

  cleanup = function() {
    // Remove the script tag.
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }

    window[id] = noop;

    if (timer) {
      clearTimeout(timer);
    }
  };

  promise = new Promise(function(resolve, reject) {
    if (timeout) {
      timer = setTimeout(function() {
        cleanup();
        reject(new Error('Timeout'));
      }, timeout);
    }

    window[id] = function(data) {
      cleanup();
      resolve(data);
    };

    // Add querystring component
    url +=
        (~url.indexOf('?') ? '&' : '?') + param + '=' + encodeURIComponent(id);
    url = url.replace('?&', '?');

    // Create script.
    script = document.createElement('script');
    script.src = url;
    target.parentNode.insertBefore(script, target);

    cancel = function() {
      if (window[id]) {
        cleanup();
        reject(new Error('Canceled'));
      }
    };
  });

  return {promise: promise, cancel: cancel};
};
