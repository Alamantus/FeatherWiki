/**
 * Modified from https://github.com/choojs/nanoscheduler
 */
export default function createScheduler () {
  if (!window._nanoScheduler) window._nanoScheduler = new NanoScheduler();
  return window._nanoScheduler;
}

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
