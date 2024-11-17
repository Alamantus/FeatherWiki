/**
 * Modified from https://github.com/choojs/nanobus
 */
import nanotiming from './nanotiming';

export default function Nanobus (name) {
  if (!(this instanceof Nanobus)) return new Nanobus(name);

  this._name = name || 'nanobus';
  this._starListeners = [];
  this._listeners = {};
}

Nanobus.prototype.emit = function (eventName) {
  var data = [];
  for (var i = 1, len = arguments.length; i < len; i++) {
    data.push(arguments[i]);
  }

  var emitTiming = nanotiming(this._name + "('" + eventName.toString() + "')");
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

Nanobus.prototype.on = Nanobus.prototype.addListener = function (eventName, listener) {
  if (eventName === '*') {
    this._starListeners.push(listener);
  } else {
    if (!this._listeners[eventName]) this._listeners[eventName] = [];
    this._listeners[eventName].push(listener);
  }
  return this;
}

Nanobus.prototype.prependListener = function (eventName, listener) {
  if (eventName === '*') {
    this._starListeners.unshift(listener);
  } else {
    if (!this._listeners[eventName]) this._listeners[eventName] = [];
    this._listeners[eventName].unshift(listener);
  }
  return this;
}

Nanobus.prototype.once = function (eventName, listener) {
  var self = this;
  this.on(eventName, once);
  function once () {
    listener.apply(self, arguments);
    self.removeListener(eventName, once);
  }
  return this;
}

Nanobus.prototype.prependOnceListener = function (eventName, listener) {
  var self = this;
  this.prependListener(eventName, once);
  function once () {
    listener.apply(self, arguments);
    self.removeListener(eventName, once);
  }
  return this;
}

Nanobus.prototype.removeListener = function (eventName, listener) {
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

Nanobus.prototype.removeAllListeners = function (eventName) {
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

Nanobus.prototype.listeners = function (eventName) {
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

Nanobus.prototype._emit = function (arr, eventName, data, uuid) {
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
