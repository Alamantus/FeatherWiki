/**
 * Modified from https://github.com/choojs/nanotiming
 */
import createScheduler from './nanoscheduler';
const scheduler = createScheduler();

var perf;
nanotiming.disabled = true;
try {
  perf = window.performance;
  nanotiming.disabled = window.localStorage.DISABLE_NANOTIMING === 'true' || !perf.mark;
} catch (e) { }

export default function nanotiming (name) {
  if (nanotiming.disabled) return noop;

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

function noop (cb) {
  if (cb) {
    scheduler.push(function () {
      cb(new Error('nanotiming: performance API unavailable'));
    });
  }
}
