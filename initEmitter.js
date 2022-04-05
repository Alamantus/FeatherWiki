import { compress } from 'json-compress';

export const initEmitter = (state, emitter) => {
  emitter.on('save', async () => {
    const output = `<!DOCTYPE html><html lang=en><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${state.p.title}</title>${state.p.description ? '<meta name="description" content="' + state.p.description.replace(/"/g, '\\"') + '">' : ''}
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

  return emitter;
}