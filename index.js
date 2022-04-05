import.meta.hot;
import choo from 'choo';
import html from 'choo/html';

const app = choo({ hash: true });
// Reminder: outlinks require `target="_blank"` *and* `rel="noopener noreferrer"`

if (__SNOWPACK_ENV__.MODE === 'development') {
  const chooDevtools = await import('choo-devtools');
  app.use(chooDevtools.default());
}

app.use(countStore)
app.route('/', mainView);
app.mount('body');

function mainView (state, emit) {
  return html`
    <body>
      <h1>It's a wiki! ${state.count}</h1>
      <button onclick=${onclick}>Increment</button>
      <p><a href="https://robbie.antenesse.net" target="_blank" rel="noopener noreferrer">Robbie's Site</a></p>
    </body>
  `;

  function onclick () {
    emit('increment', 1);
  }
}

function countStore (state, emitter) {
  state.count = 0
  emitter.on('increment', function (count) {
    state.count += count
    emitter.emit('render')
  })
}
