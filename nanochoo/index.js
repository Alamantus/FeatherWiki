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

import nanobus from './nanobus' // Handles the emitter
var nanohref = require('nanohref') // Prevents browser navigation within wiki
import nanomorph from './nanomorph' // Efficiently diffs DOM elements for render
import nanoraf from './nanoraf' // Prevents too many renders

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
