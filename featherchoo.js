/**
 * Modified from nanochoo, a fork of choo at about half the size, specifically for use with Feather Wiki
 * https://github.com/nanaian/nanochoo
 * 
 * The `nanochoo` fork of `choo@6` removed the `navigate` events and `nanohref` package
 * that Feather Wiki needs to prevent links from changing pages, so that has been
 * added back in along with a `go` event that combines the removed `navigate`,
 * `pushState`, and `replaceState` events into one. I also removed the `toString`
 * method entirely because Feather Wiki is only focused on browser use.
 * 
 * `nanochoo`'s primary changes to `choo@6` are recorded in its README on GitHub.
 * 
 * @licence MIT
 */
var params = () => {
  const p = {};
  (new URLSearchParams(window.location.search)).forEach((v, k, s) => {
    v = s.getAll(k);
    p[k] = v.length > 1 ? v : v[0];
  });
  return p;
};

var HISTORY = {};

export default function Choo () {
  if (!(this instanceof Choo)) return new Choo()

  this.ready = (f) => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') f()
    else document.addEventListener('DOMContentLoaded', f)
  }

  // define events used by choo
  this._events = {
    ONLOAD: 'DOMContentLoaded',
    TITLE: 'DOMTitleChange',
    RENDER: 'render',
    GO: 'go',
  }

  // properties for internal use only
  this._loaded = false
  this._tree = null
  this._view = () => {};


  // properties that are part of the API
  this.emitter = nanobus('choo.emit')
  this.emit = this.emitter.emit.bind(this.emitter)

  this.state = {
    events: this._events,
    title: document.title,
    query: params(),
  }

  this.emitter.prependListener(this._events.TITLE, (title) => {
    this.state.title = document.title = title
  })
}

Choo.prototype.start = function () {
  const hashScroll = () => {
    const el = document.getElementById(location.hash.substring(1));
    if (!el) return false;
    el?.scrollIntoView();
    return true;
  }
  this.emitter.prependListener(this._events.GO, (to = null, action = 'push') => {
    if (to) {
      history[action + 'State'](HISTORY, this.state.title, to)
    }
    this.state.query = params()
    if (this._loaded) {
      this.emit(this._events.RENDER, () => {
        // Scroll to top of page if no location hash is set
        hashScroll() || window.scroll(0, 0);
      })
    }
  })

  window.onpopstate = () => {
    this.emit(this._events.GO)
  }

  nanohref(({ href }) => {
    var currHref = window.location.href
    if (href === currHref) return
    this.emit(this._events.GO, href)
  })

  var render = () => this._view(this.state, this.emit)

  this._tree = render()

  this._rq = [] // render queue
  this._rd = null // render debounce
  this.emitter.prependListener(this._events.RENDER, cb => {
    if (typeof cb === 'function') this._rq.push(cb)
    if (this._rd !== null) clearTimeout(this._rd)
    this._rd = setTimeout(nanoraf(() => {
      var newTree = render()
      nanomorph(this._tree, newTree)
      while(this._rq.length > 0) (this._rq.shift())()
    }), 9)
  })

  this.ready(() => {
    this.emit(this._events.ONLOAD)
    this._loaded = true
    hashScroll();
  })

  return this._tree
}

Choo.prototype.mount = function (selector) {
  this.ready(() => {
    var newTree = this.start()
    if (typeof selector === 'string') {
      this._tree = document.querySelector(selector)
    } else {
      this._tree = selector
    }

    nanomorph(this._tree, newTree)
  })
}

/**
 * Modified from https://github.com/choojs/nanobus
 * Handles the emitter
 */
function nanobus () {
  if (!(this instanceof nanobus)) return new nanobus();

  this._starListeners = [];
  this._listeners = {};
}

nanobus.prototype.emit = function (eventName) {
  var data = [];
  for (var i = 1, len = arguments.length; i < len; i++) {
    data.push(arguments[i]);
  }

  var emitTiming = nanotiming("nanobus('" + eventName.toString() + "')");
  var listeners = this._listeners[eventName];
  if (listeners && listeners.length > 0) {
    this._emit(this._listeners[eventName], data);
  }

  if (this._starListeners.length > 0) {
    this._emit(this._starListeners, eventName, data, emitTiming.uuid);
  }
  emitTiming();

  return this;
}

nanobus.prototype.on = nanobus.prototype.addListener = function (eventName, listener) {
  if (eventName === '*') {
    this._starListeners.push(listener);
  } else {
    if (!this._listeners[eventName]) this._listeners[eventName] = [];
    this._listeners[eventName].push(listener);
  }
  return this;
}

nanobus.prototype.prependListener = function (eventName, listener) {
  if (eventName === '*') {
    this._starListeners.unshift(listener);
  } else {
    if (!this._listeners[eventName]) this._listeners[eventName] = [];
    this._listeners[eventName].unshift(listener);
  }
  return this;
}

nanobus.prototype.once = function (eventName, listener) {
  var self = this;
  this.on(eventName, once);
  function once () {
    listener.apply(self, arguments);
    self.removeListener(eventName, once);
  }
  return this;
}

nanobus.prototype.prependOnceListener = function (eventName, listener) {
  var self = this;
  this.prependListener(eventName, once);
  function once () {
    listener.apply(self, arguments);
    self.removeListener(eventName, once);
  }
  return this;
}

nanobus.prototype.removeListener = function (eventName, listener) {
  if (eventName === '*') {
    this._starListeners = this._starListeners.slice();
    return remove(this._starListeners, listener);
  } else {
    if (typeof this._listeners[eventName] !== 'undefined') {
      this._listeners[eventName] = this._listeners[eventName].slice();
    }

    return remove(this._listeners[eventName], listener);
  }

  function remove (arr, listener) {
    if (!arr) return;
    var index = arr.indexOf(listener);
    if (index !== -1) {
      arr.splice(index, 1);
      return true;
    }
  }
}

nanobus.prototype.removeAllListeners = function (eventName) {
  if (eventName) {
    if (eventName === '*') {
      this._starListeners = [];
    } else {
      this._listeners[eventName] = [];
    }
  } else {
    this._starListeners = [];
    this._listeners = {};
  }
  return this;
}

nanobus.prototype.listeners = function (eventName) {
  var listeners = eventName !== '*'
    ? this._listeners[eventName]
    : this._starListeners;

  var ret = [];
  if (listeners) {
    var ilength = listeners.length;
    for (var i = 0; i < ilength; i++) ret.push(listeners[i]);
  }
  return ret;
}

nanobus.prototype._emit = function (arr, eventName, data, uuid) {
  if (typeof arr === 'undefined') return;
  if (arr.length === 0) return;
  if (data === undefined) {
    data = eventName;
    eventName = null;
  }

  if (eventName) {
    if (uuid !== undefined) {
      data = [eventName].concat(data, uuid);
    } else {
      data = [eventName].concat(data);
    }
  }

  var length = arr.length;
  for (var i = 0; i < length; i++) {
    var listener = arr[i];
    listener.apply(listener, data);
  }
}

/**
 * Modified from https://github.com/choojs/nanotiming
 */
const scheduler = new NanoScheduler();

var perf;
nanotiming.disabled = true;
try {
  perf = window.performance;
  nanotiming.disabled = window.localStorage.DISABLE_NANOTIMING === 'true' || !perf.mark;
} catch (e) { }

function nanotiming (name) {
  if (nanotiming.disabled) return function (cb) {
    if (cb) {
      scheduler.push(function () {
        cb(new Error('nanotiming: performance API unavailable'));
      });
    }
  };

  var uuid = (perf.now() * 10000).toFixed() % Number.MAX_SAFE_INTEGER;
  var startName = 'start-' + uuid + '-' + name;
  perf.mark(startName);

  function end (cb) {
    var endName = 'end-' + uuid + '-' + name;
    perf.mark(endName);

    scheduler.push(function () {
      var err = null;
      try {
        var measureName = name + ' [' + uuid + ']';
        perf.measure(measureName, startName, endName);
        perf.clearMarks(startName);
        perf.clearMarks(endName);
      } catch (e) {
        err = e;
      }
      if (cb) cb(err, name);
    })
  }

  end.uuid = uuid;
  return end;
}

/**
 * Modified from https://github.com/choojs/nanoscheduler
 */
function NanoScheduler () {
  this.hasIdle = typeof window.requestIdleCallback !== 'undefined';
  this.method = this.hasIdle ? window.requestIdleCallback.bind(window) : this.setTimeout;
  this.scheduled = false;
  this.queue = [];
}

NanoScheduler.prototype.push = function (cb) {
  this.queue.push(cb);
  this.schedule();
}

NanoScheduler.prototype.schedule = function () {
  if (this.scheduled) return;

  this.scheduled = true;
  var self = this;
  this.method(function (idleDeadline) {
    var cb;
    while (self.queue.length && idleDeadline.timeRemaining() > 0) {
      cb = self.queue.shift();
      cb(idleDeadline);
    }
    self.scheduled = false;
    if (self.queue.length) self.schedule();
  })
}

NanoScheduler.prototype.setTimeout = function (cb) {
  setTimeout(cb, 0, {
    timeRemaining: () => 1,
  });
}

/**
 * Modified from https://github.com/choojs/nanohref
 * Prevents browser navigation within wiki
 */
var safeExternalLink = /(noopener|noreferrer) (noopener|noreferrer)/
var protocolLink = /^[\w-_]+:/

function nanohref (cb, root) {
  root = root || window.document

  window.addEventListener('click', function (e) {
    if ((e.button && e.button !== 0) ||
      e.ctrlKey || e.metaKey || e.altKey || e.shiftKey ||
      e.defaultPrevented) return

    var anchor = (function traverse (node) {
      if (!node || node === root) return
      if (node.localName !== 'a' || node.href === undefined) {
        return traverse(node.parentNode)
      }
      return node
    })(e.target)

    if (!anchor) return

    if (window.location.protocol !== anchor.protocol ||
        window.location.hostname !== anchor.hostname ||
        window.location.port !== anchor.port ||
        anchor.hasAttribute('download') ||
        (anchor.getAttribute('target') === '_blank' &&
        safeExternalLink.test(anchor.getAttribute('rel'))) ||
      protocolLink.test(anchor.getAttribute('href'))) return

    e.preventDefault()
    cb(anchor)
  })
}

/**
 * Modified from https://github.com/choojs/nanomorph
 * Efficiently diffs DOM elements for render
 */
var ELEMENT_NODE = 1
var TEXT_NODE = 3
var COMMENT_NODE = 8

// Morph one tree into another tree
//
// no parent
//   -> same: diff and walk children
//   -> not same: replace and return
// old node doesn't exist
//   -> insert new node
// new node doesn't exist
//   -> delete old node
// nodes are not the same
//   -> diff nodes and apply patch to old node
// nodes are the same
//   -> walk all child nodes and append to old node
function nanomorph (oldTree, newTree) {
  return walk(newTree, oldTree)
}

// Walk and morph a dom tree
function walk (newNode, oldNode) {
  if (!oldNode) {
    return newNode
  } else if (!newNode) {
    return null
  } else if (newNode.isSameNode && newNode.isSameNode(oldNode)) {
    return oldNode
  } else if (newNode.tagName !== oldNode.tagName) {
    return newNode
  } else {
    morph(newNode, oldNode)
    updateChildren(newNode, oldNode)
    return oldNode
  }
}

// Update the children of elements
// (obj, obj) -> null
function updateChildren (newNode, oldNode) {
  var oldChild, newChild, morphed, oldMatch

  // The offset is only ever increased, and used for [i - offset] in the loop
  var offset = 0

  for (var i = 0; ; i++) {
    oldChild = oldNode.childNodes[i]
    newChild = newNode.childNodes[i - offset]
    // Both nodes are empty, do nothing
    if (!oldChild && !newChild) {
      break

    // There is no new child, remove old
    } else if (!newChild) {
      oldNode.removeChild(oldChild)
      i--

    // There is no old child, add new
    } else if (!oldChild) {
      oldNode.appendChild(newChild)
      offset++

    // Both nodes are the same, morph
    } else if (same(newChild, oldChild)) {
      morphed = walk(newChild, oldChild)
      if (morphed !== oldChild) {
        oldNode.replaceChild(morphed, oldChild)
        offset++
      }

    // Both nodes do not share an ID or a placeholder, try reorder
    } else {
      oldMatch = null

      // Try and find a similar node somewhere in the tree
      for (var j = i; j < oldNode.childNodes.length; j++) {
        if (same(oldNode.childNodes[j], newChild)) {
          oldMatch = oldNode.childNodes[j]
          break
        }
      }

      // If there was a node with the same ID or placeholder in the old list
      if (oldMatch) {
        morphed = walk(newChild, oldMatch)
        if (morphed !== oldMatch) offset++
        oldNode.insertBefore(morphed, oldChild)

      // It's safe to morph two nodes in-place if neither has an ID
      } else if (!newChild.id && !oldChild.id) {
        morphed = walk(newChild, oldChild)
        if (morphed !== oldChild) {
          oldNode.replaceChild(morphed, oldChild)
          offset++
        }

      // Insert the node at the index if we couldn't morph or find a matching node
      } else {
        oldNode.insertBefore(newChild, oldChild)
        offset++
      }
    }
  }
}

function same (a, b) {
  if (a.id) return a.id === b.id
  if (a.isSameNode) return a.isSameNode(b)
  if (a.tagName !== b.tagName) return false
  if (a.type === TEXT_NODE) return a.nodeValue === b.nodeValue
  return false
}

var events = [
  // attribute events (can be set with attributes)
  'onclick', 'ondblclick', 'onmousedown', 'onmouseup',
  'onmouseover', 'onmousemove', 'onmouseout', 'onmouseenter', 'onmouseleave',
  'ontouchcancel', 'ontouchend', 'ontouchmove', 'ontouchstart', 'ondragstart',
  'ondrag', 'ondragenter', 'ondragleave', 'ondragover', 'ondrop', 'ondragend',
  'onkeydown', 'onkeypress', 'onkeyup',
  'onunload', 'onabort', 'onerror', 'onresize', 'onscroll', 'onselect',
  'onchange', 'onsubmit', 'onreset', 'onfocus', 'onblur', 'oninput',
  'onanimationend', 'onanimationiteration', 'onanimationstart',
  // other common events
  'oncontextmenu', 'onfocusin', 'onfocusout'
]
var eventsLength = events.length

// diff elements and apply the resulting patch to the old node
// (obj, obj) -> null
function morph (newNode, oldNode) {
  var nodeType = newNode.nodeType
  var nodeName = newNode.nodeName

  if (nodeType === ELEMENT_NODE) {
    copyAttrs(newNode, oldNode)
  }

  if (nodeType === TEXT_NODE || nodeType === COMMENT_NODE) {
    if (oldNode.nodeValue !== newNode.nodeValue) {
      oldNode.nodeValue = newNode.nodeValue
    }
  }

  // Some DOM nodes are weird
  // https://github.com/patrick-steele-idem/morphdom/blob/master/src/specialElHandlers.js
  if (nodeName === 'INPUT') updateInput(newNode, oldNode)
  else if (nodeName === 'OPTION') updateAttribute(newNode, oldNode, 'selected')
  else if (nodeName === 'TEXTAREA') updateTextarea(newNode, oldNode)

  copyEvents(newNode, oldNode)
}

function copyAttrs (newNode, oldNode) {
  var oldAttrs = oldNode.attributes
  var newAttrs = newNode.attributes
  var attrNamespaceURI = null
  var attrValue = null
  var fromValue = null
  var attrName = null
  var attr = null

  for (var i = newAttrs.length - 1; i >= 0; --i) {
    attr = newAttrs[i]
    attrName = attr.name
    attrNamespaceURI = attr.namespaceURI
    attrValue = attr.value
    if (attrNamespaceURI) {
      attrName = attr.localName || attrName
      fromValue = oldNode.getAttributeNS(attrNamespaceURI, attrName)
      if (fromValue !== attrValue) {
        oldNode.setAttributeNS(attrNamespaceURI, attrName, attrValue)
      }
    } else {
      if (!oldNode.hasAttribute(attrName)) {
        oldNode.setAttribute(attrName, attrValue)
      } else {
        fromValue = oldNode.getAttribute(attrName)
        if (fromValue !== attrValue) {
          // apparently values are always cast to strings, ah well
          if (attrValue === 'null' || attrValue === 'undefined') {
            oldNode.removeAttribute(attrName)
          } else {
            oldNode.setAttribute(attrName, attrValue)
          }
        }
      }
    }
  }

  // Remove any extra attributes found on the original DOM element that
  // weren't found on the target element.
  for (var j = oldAttrs.length - 1; j >= 0; --j) {
    attr = oldAttrs[j]
    if (attr.specified !== false) {
      attrName = attr.name
      attrNamespaceURI = attr.namespaceURI

      if (attrNamespaceURI) {
        attrName = attr.localName || attrName
        if (!newNode.hasAttributeNS(attrNamespaceURI, attrName)) {
          oldNode.removeAttributeNS(attrNamespaceURI, attrName)
        }
      } else {
        if (!newNode.hasAttributeNS(null, attrName)) {
          oldNode.removeAttribute(attrName)
        }
      }
    }
  }
}

function copyEvents (newNode, oldNode) {
  for (var i = 0; i < eventsLength; i++) {
    var ev = events[i]
    if (newNode[ev]) {           // if new element has a whitelisted attribute
      oldNode[ev] = newNode[ev]  // update existing element
    } else if (oldNode[ev]) {    // if existing element has it and new one doesnt
      oldNode[ev] = undefined    // remove it from existing element
    }
  }
}

// The "value" attribute is special for the <input> element since it sets the
// initial value. Changing the "value" attribute without changing the "value"
// property will have no effect since it is only used to the set the initial
// value. Similar for the "checked" attribute, and "disabled".
function updateInput (newNode, oldNode) {
  var newValue = newNode.value
  var oldValue = oldNode.value

  updateAttribute(newNode, oldNode, 'checked')
  updateAttribute(newNode, oldNode, 'disabled')

  // The "indeterminate" property can not be set using an HTML attribute.
  // See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
  if (newNode.indeterminate !== oldNode.indeterminate) {
    oldNode.indeterminate = newNode.indeterminate
  }

  // Persist file value since file inputs can't be changed programatically
  if (oldNode.type === 'file') return

  if (newValue !== oldValue) {
    oldNode.setAttribute('value', newValue)
    oldNode.value = newValue
  }

  if (newValue === 'null') {
    oldNode.value = ''
    oldNode.removeAttribute('value')
  }

  if (!newNode.hasAttributeNS(null, 'value')) {
    oldNode.removeAttribute('value')
  } else if (oldNode.type === 'range') {
    // this is so elements like slider move their UI thingy
    oldNode.value = newValue
  }
}

function updateTextarea (newNode, oldNode) {
  var newValue = newNode.value
  if (newValue !== oldNode.value) {
    oldNode.value = newValue
  }

  if (oldNode.firstChild && oldNode.firstChild.nodeValue !== newValue) {
    // Needed for IE. Apparently IE sets the placeholder as the
    // node value and vise versa. This ignores an empty update.
    if (newValue === '' && oldNode.firstChild.nodeValue === oldNode.placeholder) {
      return
    }

    oldNode.firstChild.nodeValue = newValue
  }
}

function updateAttribute (newNode, oldNode, name) {
  if (newNode[name] !== oldNode[name]) {
    oldNode[name] = newNode[name]
    if (newNode[name]) {
      oldNode.setAttribute(name, '')
    } else {
      oldNode.removeAttribute(name)
    }
  }
}

/**
 * Modified from https://github.com/choojs/nanoraf
 * Prevents too many renders
 */
// Only call RAF when needed
// (fn) -> fn
function nanoraf (render) {
  var redrawScheduled = false
  var args = null

  return function frame () {
    if (args === null && !redrawScheduled) {
      redrawScheduled = true

      window.requestAnimationFrame(function redraw () {
        redrawScheduled = false

        var length = args.length
        var _args = new Array(length)
        for (var i = 0; i < length; i++) _args[i] = args[i]

        render.apply(render, _args)
        args = null
      })
    }

    args = arguments
  }
}
