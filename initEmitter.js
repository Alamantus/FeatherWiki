import { compress, pack } from 'json-compress';

export const initEmitter = (state, emitter) => {
  state.events.SHOW_NEW_PAGE_FIELD = 'showNewPageField';
  emitter.on(state.events.SHOW_NEW_PAGE_FIELD, () => {
    state.showNewPageField = true;
    emitter.emit(state.events.RENDER);
  });
  
  state.events.CREATE_NEW_PAGE = 'createNewPage';
  emitter.on(state.events.CREATE_NEW_PAGE, () => {
    const title = document.getElementById('newPageField').value.trim();
    if (title.length < 1) return;

    const genId = () => {
      const s = [];
      for (let i = 0; i < 10; i++) {
        const code = Math.round(Math.random() * (126 - 32)) + 32;
        console.log(code);
        s.push(String.fromCharCode(code));
      }
      return s.join('');
    }
    let id = genId();
    while (state.p.pages.findIndex(p => p.id === id) >= 0) {
      id = genId();
    }
    const slug = title.toLowerCase().replace(/\s/g, '_').replace(/\W/g, '-');
    state.p.pages.push({ id, title, slug, });
    state.showNewPageField = false;
    emitter.emit(state.events.CHECK_CHANGED);
    emitter.emit(state.events.PUSHSTATE, state.siteRoot + '?page=' + slug);
  });

  state.events.UPDATE_PAGE = 'updatePage';
  emitter.on(state.events.UPDATE_PAGE, (page) => {
    const pIndex = state.p.pages.findIndex(p => p.id === page.id);
    if (pIndex > -1) {
      state.p.pages[pIndex] = page;
    } else {
      state.p.pages.push(page);
    }
    emitter.emit(state.events.CHECK_CHANGED);
  });

  state.events.CHECK_CHANGED = 'checkChanged';
  emitter.on(state.events.CHECK_CHANGED, () => {
    state.currentState = pack(state.p);
    state.changedSinceSave = state.lastSave !== state.currentState;
    emitter.emit(state.events.RENDER);
  });

  state.events.SAVE_WIKI = 'saveWiki';
  emitter.on('saveWiki', async () => {
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

    state.lastSave = pack(state.p);
    emitter.emit(state.events.CHECK_CHANGED);
  });

  return emitter;
}