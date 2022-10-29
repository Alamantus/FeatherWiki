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

var nanobus = require('nanobus') // Handles the emitter
var nanohref = require('nanohref') // Prevents browser navigation within wiki
var nanomorph = require('nanomorph') // Efficiently diffs DOM elements for render
var nanoraf = require('nanoraf') // Prevents too many renders

function documentReady (f) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') f()
  else document.addEventListener('DOMContentLoaded', f)
}

function getParams () {
  const p = {};
  const s = new URLSearchParams(window.location.search);
  s.forEach((v, k) => {
    v = s.getAll(k);
    p[k] = v.length > 1 ? v : v[0];
  });
  return p;
};

var HISTORY = {};

export default function Choo () {
  if (!(this instanceof Choo)) return new Choo()

  var self = this

  // define events used by choo
  this._events = {
    ONLOAD: 'DOMContentLoaded',
    TITLE: 'DOMTitleChange',
    RENDER: 'render',
    GO: 'go',
  }

  // properties for internal use only
  this._loaded = false
  this._stores = []
  this._tree = null
  this._viewHandler = null

  // properties that are part of the API
  this.emitter = nanobus('choo.emit')
  this.emit = this.emitter.emit.bind(this.emitter)

  this.state = {
    events: this._events,
    title: document.title,
    query: getParams(),
  }

  this.emitter.prependListener(this._events.TITLE, function (title) {
    self.state.title = document.title = title
  })
}

Choo.prototype.view = function (handler) {
  this._viewHandler = handler
}

Choo.prototype.use = function (cb) {
  var self = this
  this._stores.push(function () {
    cb(self.state, self.emitter, self)
  })
}

Choo.prototype.start = function () {
  var self = this
  this.emitter.prependListener(this._events.GO, function (to = null, action = 'push') {
    if (to) {
      history[action + 'State'](HISTORY, self.state.title, to)
    }
    self.state.query = getParams()
    if (self._loaded) {
      self.emitter.emit(self._events.RENDER)
    }
  })

  nanohref(function (location) {
    var href = location.href
    var currHref = window.location.href
    if (href === currHref) return
    self.emitter.emit(self._events.GO, href)
  })

  this._stores.forEach(function (initStore) {
    initStore()
  })

  function render () {
    return self._viewHandler(self.state, function (eventName, data) {
      self.emitter.emit.apply(self.emitter, arguments)
    })
  }

  this._tree = render()

  this.emitter.prependListener(self._events.RENDER, nanoraf(function () {
    var newTree = render()
    nanomorph(self._tree, newTree)
  }))

  documentReady(function () {
    self.emitter.emit(self._events.ONLOAD)
    self._loaded = true
  })

  return this._tree
}

Choo.prototype.mount = function mount (selector) {
  if (typeof window !== 'object') {
    this.selector = selector
    return this
  }

  var self = this

  documentReady(function () {
    var newTree = self.start()
    if (typeof selector === 'string') {
      self._tree = document.querySelector(selector)
    } else {
      self._tree = selector
    }

    nanomorph(self._tree, newTree)
  })
}
