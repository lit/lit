/**
 * Detects whether window and document objects are available in current environment.
 */
var isBrowser =
  typeof window !== 'undefined' &&
  typeof document !== 'undefined' &&
  window.document === document;

// Returns global object of a current environment.
var global$1 = (function () {
  if (typeof global !== 'undefined' && global.Math === Math) {
    return global;
  }
  if (typeof self !== 'undefined' && self.Math === Math) {
    return self;
  }
  if (typeof window !== 'undefined' && window.Math === Math) {
    return window;
  }
  // eslint-disable-next-line no-new-func
  return Function('return this')();
})();

/**
 * A shim for the requestAnimationFrame which falls back to the setTimeout if
 * first one is not supported.
 *
 * @returns {number} Requests' identifier.
 */
var requestAnimationFrame$1 = (function () {
  if (typeof requestAnimationFrame === 'function') {
    // It's required to use a bounded function because IE sometimes throws
    // an "Invalid calling object" error if rAF is invoked without the global
    // object on the left hand side.
    return requestAnimationFrame.bind(global$1);
  }
  var result = function (callback) {
    return setTimeout(function () {
      callback(+Date.now());
    }, 1000 / 60);
  };
  return result;
})();

// Defines minimum timeout before adding a trailing call.
var trailingTimeout = 2;
/**
 * Creates a wrapper function which ensures that provided callback will be
 * invoked only once during the specified delay period.
 *
 * @param callback - Function to be invoked after the delay period.
 * @param delay - Delay after which to invoke callback.
 */
function throttle(callback, delay) {
  var leadingCall = false,
    trailingCall = false,
    lastCallTime = 0;
  /**
   * Invokes the original callback function and schedules new invocation if
   * the "proxy" was called during current request.
   */
  function resolvePending() {
    if (leadingCall) {
      leadingCall = false;
      callback();
    }
    if (trailingCall) {
      proxy();
    }
  }
  /**
   * Callback invoked after the specified delay. It will further postpone
   * invocation of the original function delegating it to the
   * requestAnimationFrame.
   *
   * @returns {void}
   */
  function timeoutCallback() {
    requestAnimationFrame$1(resolvePending);
  }
  /**
   * Schedules invocation of the original function.
   */
  function proxy() {
    var timeStamp = Date.now();
    if (leadingCall) {
      // Reject immediately following calls.
      if (timeStamp - lastCallTime < trailingTimeout) {
        return;
      }
      // Schedule new call to be in invoked when the pending one is resolved.
      // This is important for "transitions" which never actually start
      // immediately so there is a chance that we might miss one if change
      // happens amids the pending invocation.
      trailingCall = true;
    } else {
      leadingCall = true;
      trailingCall = false;
      setTimeout(timeoutCallback, delay);
    }
    lastCallTime = timeStamp;
  }
  return proxy;
}

// Minimum delay before invoking the update of observers.
var REFRESH_DELAY = 20;
// A list of substrings of CSS properties used to find transition events that
// might affect dimensions of observed elements.
var transitionKeys = [
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'size',
  'weight',
];
// Check if MutationObserver is available.
var mutationObserverSupported = typeof MutationObserver !== 'undefined';
// Get the native implementation of HTMLElement.attachShadow
var origAttachShadow =
  isBrowser &&
  HTMLElement.prototype.attachShadow &&
  HTMLElement.prototype.attachShadow.toString().indexOf('[native code]') !== -1
    ? HTMLElement.prototype.attachShadow
    : null;
/**
 * Singleton controller class which handles updates of ResizeObserver instances.
 */
var ResizeObserverController = /** @class */ (function () {
  /**
   * Creates a new instance of ResizeObserverController.
   */
  function ResizeObserverController() {
    /**
     * Indicates whether DOM listeners have been added.
     */
    this.connected_ = false;
    /**
     * Tells that controller has subscribed for Mutation Events.
     */
    this.mutationEventsAdded_ = false;
    /**
     * Keeps reference to the instance of MutationObserver.
     */
    this.mutationsObserver_ = null;
    /**
     * A list of connected observers.
     */
    this.observers_ = [];
    this.onTransitionEnd_ = this.onTransitionEnd_.bind(this);
    this.refresh = throttle(this.refresh.bind(this), REFRESH_DELAY);
  }
  /**
   * Adds observer to observers list.
   *
   * @param observer Observer to be added.
   */
  ResizeObserverController.prototype.addObserver = function (observer) {
    if (!~this.observers_.indexOf(observer)) {
      this.observers_.push(observer);
    }
    // Add listeners if they haven't been added yet.
    if (!this.connected_) {
      this.connect_();
    }
  };
  /**
   * Removes observer from observers list.
   *
   * @param observer Observer to be removed.
   */
  ResizeObserverController.prototype.removeObserver = function (observer) {
    var observers = this.observers_;
    var index = observers.indexOf(observer);
    // Remove observer if it's present in registry.
    if (~index) {
      observers.splice(index, 1);
    }
    // Remove listeners if controller has no connected observers.
    if (!observers.length && this.connected_) {
      this.disconnect_();
    }
  };
  /**
   * Invokes the update of observers. It will continue running updates insofar
   * it detects changes.
   */
  ResizeObserverController.prototype.refresh = function () {
    var changesDetected = this.updateObservers_();
    // Continue running updates if changes have been detected as there might
    // be future ones caused by CSS transitions.
    if (changesDetected) {
      this.refresh();
    }
  };
  /**
   * Updates every observer from observers list and notifies them of queued
   * entries.
   *
   * @returns Returns "true" if any observer has detected changes in
   *      dimensions of it's elements.
   */
  ResizeObserverController.prototype.updateObservers_ = function () {
    // Collect observers that have active observations.
    var activeObservers = this.observers_.filter(function (observer) {
      return observer.gatherActive(), observer.hasActive();
    });
    // Deliver notifications in a separate cycle in order to avoid any
    // collisions between observers, e.g. when multiple instances of
    // ResizeObserver are tracking the same element and the callback of one
    // of them changes content dimensions of the observed target. Sometimes
    // this may result in notifications being blocked for the rest of observers.
    activeObservers.forEach(function (observer) {
      return observer.broadcastActive();
    });
    return activeObservers.length > 0;
  };
  /**
   * Initializes DOM listeners.
   */
  ResizeObserverController.prototype.connect_ = function () {
    // Do nothing if running in a non-browser environment or if listeners
    // have been already added.
    if (!isBrowser || this.connected_) {
      return;
    }
    // Subscription to the "Transitionend" event is used as a workaround for
    // delayed transitions. This way it's possible to capture at least the
    // final state of an element.
    document.addEventListener('transitionend', this.onTransitionEnd_);
    window.addEventListener('resize', this.refresh);
    if (mutationObserverSupported) {
      this.mutationsObserver_ = new MutationObserver(this.refresh);
      var options_1 = {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true,
      };
      this.mutationsObserver_.observe(document, options_1);
      if (origAttachShadow) {
        var controller_1 = this;
        (function observeExistingShadowRoots(node) {
          var shadowRoot = node.shadowRoot;
          if (shadowRoot) {
            controller_1.mutationsObserver_.observe(shadowRoot, options_1);
            observeExistingShadowRoots(shadowRoot);
          }
          var child = node.firstElementChild;
          while (child) {
            observeExistingShadowRoots(child);
            child = child.nextElementSibling;
          }
        })(document);
        HTMLElement.prototype.attachShadow = function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          var shadowRoot = origAttachShadow.apply(this, args);
          controller_1.mutationsObserver_.observe(shadowRoot, options_1);
          return shadowRoot;
        };
      }
    } else {
      document.addEventListener('DOMSubtreeModified', this.refresh);
      this.mutationEventsAdded_ = true;
    }
    this.connected_ = true;
  };
  /**
   * Removes DOM listeners.
   */
  ResizeObserverController.prototype.disconnect_ = function () {
    // Do nothing if running in a non-browser environment or if listeners
    // have been already removed.
    if (!isBrowser || !this.connected_) {
      return;
    }
    document.removeEventListener('transitionend', this.onTransitionEnd_);
    window.removeEventListener('resize', this.refresh);
    if (this.mutationsObserver_) {
      this.mutationsObserver_.disconnect();
      if (origAttachShadow) {
        HTMLElement.prototype.attachShadow = origAttachShadow;
      }
    }
    if (this.mutationEventsAdded_) {
      document.removeEventListener('DOMSubtreeModified', this.refresh);
    }
    this.mutationsObserver_ = null;
    this.mutationEventsAdded_ = false;
    this.connected_ = false;
  };
  /**
   * "Transitionend" event handler.
   */
  ResizeObserverController.prototype.onTransitionEnd_ = function (_a) {
    var _b = _a.propertyName,
      propertyName = _b === void 0 ? '' : _b;
    // Detect whether transition may affect dimensions of an element.
    var isReflowProperty = transitionKeys.some(function (key) {
      return !!~propertyName.indexOf(key);
    });
    if (isReflowProperty) {
      this.refresh();
    }
  };
  /**
   * Returns instance of the ResizeObserverController.
   */
  ResizeObserverController.getInstance = function () {
    if (!ResizeObserverController.instance_) {
      ResizeObserverController.instance_ = new ResizeObserverController();
    }
    return ResizeObserverController.instance_;
  };
  /**
   * Holds reference to the controller's instance.
   */
  ResizeObserverController.instance_ = null;
  return ResizeObserverController;
})();

/*! *****************************************************************************
 Copyright (c) Microsoft Corporation. All rights reserved.
 Licensed under the Apache License, Version 2.0 (the "License"); you may not use
 this file except in compliance with the License. You may obtain a copy of the
 License at http://www.apache.org/licenses/LICENSE-2.0
 
 THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
 WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
 MERCHANTABLITY OR NON-INFRINGEMENT.
 
 See the Apache Version 2.0 License for specific language governing permissions
 and limitations under the License.
 ***************************************************************************** */

function __values(o) {
  var m = typeof Symbol === 'function' && o[Symbol.iterator],
    i = 0;
  if (m) return m.call(o);
  return {
    next: function () {
      if (o && i >= o.length) o = void 0;
      return {value: o && o[i++], done: !o};
    },
  };
}

/**
 * Defines non-writable/enumerable properties of the provided target object.
 *
 * @param target Object for which to define properties.
 * @param props Properties to be defined.
 * @returns Target object.
 */
var defineConfigurable = function (target, props) {
  var e_1, _a;
  try {
    for (
      var _b = __values(Object.keys(props)), _c = _b.next();
      !_c.done;
      _c = _b.next()
    ) {
      var key = _c.value;
      Object.defineProperty(target, key, {
        value: props[key],
        enumerable: false,
        writable: false,
        configurable: true,
      });
    }
  } catch (e_1_1) {
    e_1 = {error: e_1_1};
  } finally {
    try {
      if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
    } finally {
      if (e_1) throw e_1.error;
    }
  }
  return target;
};

/**
 * Returns the global object associated with provided element.
 *
 * @param {EventT} target
 * @returns {Object}
 */
var getWindowOf = function (target) {
  var _a;
  // Assume that the element is an instance of Node, which means that it
  // has the "ownerDocument" property from which we can retrieve a
  // corresponding global object.
  // Return the local global object if it's not possible extract one from
  // provided element.
  return (
    ((_a =
      target === null || target === void 0 ? void 0 : target.ownerDocument) ===
      null || _a === void 0
      ? void 0
      : _a.defaultView) || global$1
  );
};

// Placeholder of an empty content rectangle.
var emptyRect = createRectInit(0, 0, 0, 0);
/**
 * Converts provided string to a number.
 */
function toFloat(value) {
  if (typeof value === 'number') {
    return value;
  }
  return parseFloat(value) || 0;
}
/**
 * Extracts borders size from provided styles.
 */
function getBordersSize(styles) {
  var positions = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    positions[_i - 1] = arguments[_i];
  }
  return positions.reduce(function (size, position) {
    var value = styles['border-' + position + '-width'];
    return size + toFloat(value);
  }, 0);
}
/**
 * Extracts paddings sizes from provided styles.
 */
function getPaddings(styles) {
  var st = styles;
  return {
    top: toFloat(st['padding-top']),
    right: toFloat(st['padding-right']),
    bottom: toFloat(st['padding-bottom']),
    left: toFloat(st['padding-left']),
  };
}
/**
 * Calculates content rectangle of provided SVG element.
 *
 * @param target Element content rectangle of which needs to be calculated.
 */
function getSVGContentRect(target) {
  var bbox = target.getBBox();
  return createRectInit(0, 0, bbox.width, bbox.height);
}
/**
 * Calculates content rectangle of provided HTMLElement.
 *
 * @param target Element for which to calculate the content rectangle.
 */
function getHTMLElementContentRect(target) {
  // Client width & height properties can't be
  // used exclusively as they provide rounded values.
  var clientWidth = target.clientWidth,
    clientHeight = target.clientHeight;
  // By this condition we can catch all non-replaced inline, hidden and
  // detached elements. Though elements with width & height properties less
  // than 0.5 will be discarded as well.
  //
  // Without it we would need to implement separate methods for each of
  // those cases and it's not possible to perform a precise and performance
  // effective test for hidden elements. E.g. even jQuery's ':visible' filter
  // gives wrong results for elements with width & height less than 0.5.
  if (!clientWidth && !clientHeight) {
    return emptyRect;
  }
  var styles = getWindowOf(target).getComputedStyle(target);
  var paddings = getPaddings(styles);
  var horizPad = paddings.left + paddings.right;
  var vertPad = paddings.top + paddings.bottom;
  // Computed styles of width & height are being used because they are the
  // only dimensions available to JS that contain non-rounded values. It could
  // be possible to utilize the getBoundingClientRect if only it's data wasn't
  // affected by CSS transformations let alone paddings, borders and scroll
  // bars.
  var width = toFloat(styles.width),
    height = toFloat(styles.height);
  // Width & height include paddings and borders when the 'border-box' box
  // model is applied (except for IE).
  if (styles.boxSizing === 'border-box') {
    // Following conditions are required to handle Internet Explorer which
    // doesn't include paddings and borders to computed CSS dimensions.
    //
    // We can say that if CSS dimensions + paddings are equal to the "client"
    // properties then it's either IE, and thus we don't need to subtract
    // anything, or an element merely doesn't have paddings/borders styles.
    if (Math.round(width + horizPad) !== clientWidth) {
      width -= getBordersSize(styles, 'left', 'right') + horizPad;
    }
    if (Math.round(height + vertPad) !== clientHeight) {
      height -= getBordersSize(styles, 'top', 'bottom') + vertPad;
    }
  }
  // Following steps can't be applied to the document's root element as its
  // client[Width/Height] properties represent viewport area of the window.
  // Besides, it's as well not necessary as the <html> itself neither has
  // rendered scroll bars nor it can be clipped.
  if (!isDocumentElement(target)) {
    // In some browsers (only in Firefox, actually) CSS width & height
    // include scroll bars size which can be removed at this step as scroll
    // bars are the only difference between rounded dimensions + paddings
    // and "client" properties, though that is not always true in Chrome.
    var vertScrollbar = Math.round(width + horizPad) - clientWidth;
    var horizScrollbar = Math.round(height + vertPad) - clientHeight;
    // Chrome has a rather weird rounding of "client" properties.
    // E.g. for an element with content width of 314.2px it sometimes gives
    // the client width of 315px and for the width of 314.7px it may give
    // 314px. And it doesn't happen all the time. So just ignore this delta
    // as a non-relevant.
    if (Math.abs(vertScrollbar) !== 1) {
      width -= vertScrollbar;
    }
    if (Math.abs(horizScrollbar) !== 1) {
      height -= horizScrollbar;
    }
  }
  return createRectInit(paddings.left, paddings.top, width, height);
}
/**
 * Checks whether provided element is an instance of the SVGGraphicsElement.
 *
 * @param target Element to be checked.
 */
var isSVGGraphicsElement = (function () {
  // Some browsers, namely IE and Edge, don't have the SVGGraphicsElement
  // interface.
  if (typeof SVGGraphicsElement !== 'undefined') {
    return function (target) {
      return target instanceof getWindowOf(target).SVGGraphicsElement;
    };
  }
  // If it's so, then check that element is at least an instance of the
  // SVGElement and that it has the "getBBox" method.
  // eslint-disable-next-line no-extra-parens
  return function (target) {
    return (
      target instanceof getWindowOf(target).SVGElement &&
      typeof target.getBBox === 'function'
    );
  };
})();
/**
 * Checks whether provided element is a document element (<html>).
 *
 * @param target Element to be checked.
 */
function isDocumentElement(target) {
  return target === getWindowOf(target).document.documentElement;
}
/**
 * Calculates an appropriate content rectangle for provided html or svg element.
 *
 * @param target Element content rectangle of which needs to be calculated.
 */
function getContentRect(target) {
  if (!isBrowser) {
    return emptyRect;
  }
  if (isSVGGraphicsElement(target)) {
    return getSVGContentRect(target);
  }
  return getHTMLElementContentRect(target);
}
/**
 * Creates rectangle with an interface of the DOMRectReadOnly.
 * Spec: https://drafts.fxtf.org/geometry/#domrectreadonly
 *
 * @param rectInit Object with rectangle's x/y coordinates and
 *     dimensions.
 */
function createReadOnlyRect(_a) {
  var x = _a.x,
    y = _a.y,
    width = _a.width,
    height = _a.height;
  // If DOMRectReadOnly is available use it as a prototype for the rectangle.
  var Constr =
    typeof DOMRectReadOnly !== 'undefined' ? DOMRectReadOnly : Object;
  var rect = Object.create(Constr.prototype);
  // Rectangle's properties are not writable and non-enumerable.
  defineConfigurable(rect, {
    x: x,
    y: y,
    width: width,
    height: height,
    top: y,
    right: x + width,
    bottom: height + y,
    left: x,
  });
  return rect;
}
/**
 * Creates DOMRectInit object based on the provided dimensions and the x/y
 * coordinates. Spec: https://drafts.fxtf.org/geometry/#dictdef-domrectinit
 *
 * @param x X coordinate.
 * @param y Y coordinate.
 * @param width Rectangle's width.
 * @param height Rectangle's height.
 */
function createRectInit(x, y, width, height) {
  return {x: x, y: y, width: width, height: height};
}

/**
 * Class that is responsible for computations of the content rectangle of
 * provided DOM element and for keeping track of it's changes.
 */
var ResizeObservation = /** @class */ (function () {
  /**
   * Creates an instance of ResizeObservation.
   *
   * @param target Element to be observed.
   */
  function ResizeObservation(target) {
    /**
     * Broadcasted width of content rectangle.
     */
    this.broadcastWidth = 0;
    /**
     * Broadcasted height of content rectangle.
     */
    this.broadcastHeight = 0;
    /**
     * Reference to the last observed content rectangle.
     */
    this.contentRect_ = createRectInit(0, 0, 0, 0);
    this.target = target;
  }
  /**
   * Updates content rectangle and tells whether it's width or height properties
   * have changed since the last broadcast.
   */
  ResizeObservation.prototype.isActive = function () {
    var rect = getContentRect(this.target);
    this.contentRect_ = rect;
    return (
      rect.width !== this.broadcastWidth || rect.height !== this.broadcastHeight
    );
  };
  /**
   * Updates 'broadcastWidth' and 'broadcastHeight' properties with a data
   * from the corresponding properties of the last observed content rectangle.
   *
   * @returns Last observed content rectangle.
   */
  ResizeObservation.prototype.broadcastRect = function () {
    var rect = this.contentRect_;
    this.broadcastWidth = rect.width;
    this.broadcastHeight = rect.height;
    return rect;
  };
  return ResizeObservation;
})();

var ResizeObserverEntry = /** @class */ (function () {
  /**
   * Creates an instance of ResizeObserverEntry.
   *
   * @param target Element that is being observed.
   * @param rectInit Data of the element's content rectangle.
   */
  function ResizeObserverEntry(target, rectInit) {
    var contentRect = createReadOnlyRect(rectInit);
    // According to the specification following properties are not writable
    // and are also not enumerable in the native implementation.
    //
    // Property accessors are not being used as they'd require to define a
    // private WeakMap storage which may cause memory leaks in browsers that
    // don't support this type of collections.
    defineConfigurable(this, {target: target, contentRect: contentRect});
  }
  return ResizeObserverEntry;
})();

/**
 * A collection of shims that provide minimal functionality of the ES6
 * collections.
 *
 * These implementations are not meant to be used outside of the ResizeObserver
 * modules as they cover only a limited range of use cases.
 */
/* eslint-disable require-jsdoc, valid-jsdoc */
var MapShim = (function () {
  if (typeof Map !== 'undefined') {
    return Map;
  }
  /**
   * Returns index in provided array that matches the specified key.
   */
  function getIndex(arr, key) {
    var result = -1;
    arr.some(function (entry, index) {
      if (entry[0] === key) {
        result = index;
        return true;
      }
      return false;
    });
    return result;
  }
  return /** @class */ (function () {
    function class_1() {
      this.__entries__ = [];
    }
    Object.defineProperty(class_1.prototype, 'size', {
      get: function () {
        return this.__entries__.length;
      },
      enumerable: true,
      configurable: true,
    });
    class_1.prototype.get = function (key) {
      var _a;
      var index = getIndex(this.__entries__, key);
      return (_a = this.__entries__[index]) === null || _a === void 0
        ? void 0
        : _a[1];
    };
    class_1.prototype.set = function (key, value) {
      var index = getIndex(this.__entries__, key);
      if (~index) {
        this.__entries__[index][1] = value;
      } else {
        this.__entries__.push([key, value]);
      }
    };
    class_1.prototype.delete = function (key) {
      var entries = this.__entries__;
      var index = getIndex(entries, key);
      if (~index) {
        entries.splice(index, 1);
      }
    };
    class_1.prototype.has = function (key) {
      return !!~getIndex(this.__entries__, key);
    };
    class_1.prototype.clear = function () {
      this.__entries__.splice(0);
    };
    class_1.prototype.forEach = function (callback, ctx) {
      var e_1, _a;
      if (ctx === void 0) {
        ctx = null;
      }
      try {
        for (
          var _b = __values(this.__entries__), _c = _b.next();
          !_c.done;
          _c = _b.next()
        ) {
          var entry = _c.value;
          callback.call(ctx, entry[1], entry[0]);
        }
      } catch (e_1_1) {
        e_1 = {error: e_1_1};
      } finally {
        try {
          if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
    };
    return class_1;
  })();
})();

var ResizeObserverSPI = /** @class */ (function () {
  /**
   * Creates a new instance of ResizeObserver.
   *
   * @param callback Callback function that is invoked when one of the observed
   *     elements changes it's content dimensions.
   * @param controller Controller instance which is responsible for the updates
   *     of observer.
   * @param callbackCtx Reference to the public ResizeObserver instance which
   *     will be passed to callback function.
   */
  function ResizeObserverSPI(callback, controller, callbackCtx) {
    /**
     * Collection of resize observations that have detected changes in dimensions
     * of elements.
     */
    this.activeObservations_ = [];
    /**
     * Registry of the ResizeObservation instances.
     */
    this.observations_ = new MapShim();
    if (typeof callback !== 'function') {
      throw new TypeError(
        'The callback provided as parameter 1 is not a function.'
      );
    }
    this.callback_ = callback;
    this.controller_ = controller;
    this.callbackCtx_ = callbackCtx;
  }
  /**
   * Starts observing provided element.
   *
   * @param target Element to be observed.
   */
  ResizeObserverSPI.prototype.observe = function (target) {
    if (target === undefined) {
      throw new TypeError('1 argument required, but only 0 present.');
    }
    // Do nothing if current environment doesn't have the Element interface.
    if (typeof Element === 'undefined' || !(Element instanceof Object)) {
      return;
    }
    if (!(target instanceof getWindowOf(target).Element)) {
      throw new TypeError('parameter 1 is not of type "Element".');
    }
    var observations = this.observations_;
    // Do nothing if element is already being observed.
    if (observations.has(target)) {
      return;
    }
    observations.set(target, new ResizeObservation(target));
    this.controller_.addObserver(this);
    // Force the update of observations.
    this.controller_.refresh();
  };
  /**
   * Stops observing provided element.
   *
   * @param target Element to stop observing.
   */
  ResizeObserverSPI.prototype.unobserve = function (target) {
    if (target === undefined) {
      throw new TypeError('1 argument required, but only 0 present.');
    }
    // Do nothing if current environment doesn't have the Element interface.
    if (typeof Element === 'undefined' || !(Element instanceof Object)) {
      return;
    }
    if (!(target instanceof getWindowOf(target).Element)) {
      throw new TypeError('parameter 1 is not of type "Element".');
    }
    var observations = this.observations_;
    // Do nothing if element is not being observed.
    if (!observations.has(target)) {
      return;
    }
    observations.delete(target);
    if (!observations.size) {
      this.controller_.removeObserver(this);
    }
  };
  /**
   * Stops observing all elements.
   */
  ResizeObserverSPI.prototype.disconnect = function () {
    this.clearActive();
    this.observations_.clear();
    this.controller_.removeObserver(this);
  };
  /**
   * Collects observation instances the associated element of which has changed
   * it's content rectangle.
   */
  ResizeObserverSPI.prototype.gatherActive = function () {
    var _this = this;
    this.clearActive();
    this.observations_.forEach(function (observation) {
      if (observation.isActive()) {
        _this.activeObservations_.push(observation);
      }
    });
  };
  /**
   * Invokes initial callback function with a list of ResizeObserverEntry
   * instances collected from active resize observations.
   */
  ResizeObserverSPI.prototype.broadcastActive = function () {
    // Do nothing if observer doesn't have active observations.
    if (!this.hasActive()) {
      return;
    }
    var ctx = this.callbackCtx_;
    // Create ResizeObserverEntry instance for every active observation.
    var entries = this.activeObservations_.map(function (observation) {
      return new ResizeObserverEntry(
        observation.target,
        observation.broadcastRect()
      );
    });
    this.callback_.call(ctx, entries, ctx);
    this.clearActive();
  };
  /**
   * Clears the collection of active observations.
   */
  ResizeObserverSPI.prototype.clearActive = function () {
    this.activeObservations_.splice(0);
  };
  /**
   * Tells whether observer has active observations.
   */
  ResizeObserverSPI.prototype.hasActive = function () {
    return this.activeObservations_.length > 0;
  };
  return ResizeObserverSPI;
})();

/**
 * ResizeObserver API. Encapsulates the ResizeObserver SPI implementation
 * exposing only those methods and properties that are defined in the spec.
 */
var ResizeObserver = /** @class */ (function () {
  /**
   * Creates a new instance of ResizeObserver.
   *
   * @param callback Callback that is invoked when dimensions of the observed
   *     elements change.
   */
  function ResizeObserver(callback) {
    if (!(this instanceof ResizeObserver)) {
      throw new TypeError('Cannot call a class as a function.');
    }
    if (!arguments.length) {
      throw new TypeError('1 argument required, but only 0 present.');
    }
    var controller = ResizeObserverController.getInstance();
    this.observer_ = new ResizeObserverSPI(callback, controller, this);
  }
  ResizeObserver.prototype.observe = function (target) {
    this.observer_.observe(target);
  };
  ResizeObserver.prototype.unobserve = function (target) {
    this.observer_.unobserve(target);
  };
  ResizeObserver.prototype.disconnect = function () {
    this.observer_.disconnect();
  };
  return ResizeObserver;
})();

var index = (function () {
  // Export existing implementation if available.
  if (typeof global$1.ResizeObserver !== 'undefined') {
    return global$1.ResizeObserver;
  }
  return ResizeObserver;
})();

export default index;
