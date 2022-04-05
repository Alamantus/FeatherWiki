import.meta.hot;
import choo from 'choo';
import html from 'choo/html';
import { compress, decompress } from 'json-compress';

const app = choo({ hash: true });
// Reminder: outlinks require `target="_blank"` *and* `rel="noopener noreferrer"`

if (__SNOWPACK_ENV__.MODE === 'development') {
  const chooDevtools = await import('choo-devtools');
  app.use(chooDevtools.default());
}

app.use((state, emitter) => {
  state.a = document.getElementById('a').innerHTML;
  state.s = document.getElementById('s').innerHTML;
  try {
    state.p = decompress(JSON.parse(document.getElementById('p').innerHTML));
  } catch (e) {
    state.p = {title:'New Wiki'};
  }
  state.u = {
    count: 0,
  };
  emitter.on('save', async () => {
    const output = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${state.p.title}</title><meta name="description" content="${state.p.description ?? 'It\'s like TiddlyWiki but as small as possible!'}" />
<style id="s">${state.s}</style></head><body><script id="a">${state.a}</script><script id="p" type="application/json">${JSON.stringify(compress(state.p))}</script></body></html>
`;
    const filename = /\/$/.test(window.location.pathname) ? 'index.html' : window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
    const el = document.createElement('a');
    el.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(output));
    el.setAttribute('download', filename);
    el.style.display = 'none';
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  });
  emitter.on('increment', count => {
    state.u.count += count
    emitter.emit('render')
    console.log(JSONC.compress(state.p, true));
  });
})
app.route('/', mainView);
app.mount('body');

function mainView (state, emit) {
  return html`
    <body>
      <h1>It's a ${state.p.title ?? 'wiki'}! ${state.u.count}</h1>
      <button onclick=${onclick}>Increment</button>
      <button onclick=${() => emit('save')}>Save</button>
      <p><a href="https://robbie.antenesse.net" target="_blank" rel="noopener noreferrer">Robbie's Site</a></p>
    </body>
  `;

  function onclick () {
    emit('increment', 1);
  }
}
