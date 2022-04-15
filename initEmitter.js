import { compress, pack } from 'json-compress';

import { views } from './views';

export const initEmitter = (state, emitter) => {
  emitter.on(state.events.RENDER, callback => {
    if (typeof callback === 'function') setTimeout(callback, 100);
  });

  state.events.HANDLE_404 = 'handle404';
  emitter.on(state.events.HANDLE_404, () => {
    const { page } = state.query;
    if (page?.length > 1) {
      const { help, events, siteRoot } = state;
      const slug = help.slugify(page);
      const pg = help.findPage(slug);
      if (!pg && !views[slug]) {
        const name = page.split('_').map(w => w[0].toUpperCase() + w.substring(1)).join(' ');
        emitter.emit(events.CREATE_PAGE, name, false);
      }
    } else if (page?.length > 0 && !views[page]) {
      state.pg = { name: '404', content: '<p>Page not found</p>'};
      emitter.emit(state.events.RENDER);
    }
  });

  emitter.on(state.events.DOMCONTENTLOADED, () => {
    emitter.emit(state.events.HANDLE_404);
    emitter.emit(state.events.DOMTITLECHANGE, state.pg?.name ?? state.p.name);
  });

  emitter.on(state.events.NAVIGATE, () => {
    state.edit = false;
    state.editStore = '';
    state.pg = state.help.getPage();
    emitter.emit(state.events.HANDLE_404);
    emitter.emit(state.events.DOMTITLECHANGE, state.pg?.name ?? state.p.name);
  });

  state.events.SHOW_NEW_PAGE_FIELD = 'showNewPageField';
  emitter.on(state.events.SHOW_NEW_PAGE_FIELD, () => {
    state.showNewPageField = true;
    emitter.emit(state.events.RENDER, () => {
      document.getElementById('newPageField').focus();
    });
  });
  
  state.events.CREATE_PAGE = 'createNewPage';
  emitter.on(state.events.CREATE_PAGE, (name, save = true) => {
    if (name.length < 1) return;

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
    const slug = state.help.slugify(name);
    const newPg = { id, name, slug, };
    state.showNewPageField = false;

    const { events, query, siteRoot } = state;
    if (save) {
      state.p.pages.push(newPg);
      emitter.emit(events.CHECK_CHANGED);
      emitter.emit(events[query.page !== slug ? 'REPLACESTATE' : 'PUSHSTATE'], siteRoot + '?page=' + slug);
    } else {
      state.pg = newPg;
    }
    emitter.emit(events.START_EDIT);
  });

  state.events.START_EDIT = 'startEdit';
  emitter.on(state.events.START_EDIT, () => {
    state.edit = true;
    emitter.emit(state.events.RENDER);
  });

  state.events.UPDATE_PAGE = 'updatePage';
  emitter.on(state.events.UPDATE_PAGE, (page) => {
    const pIndex = state.p.pages.findIndex(p => p.id === page.id);
    if (pIndex > -1) {
      state.p.pages[pIndex] = page;
    } else {
      state.p.pages.push(page);
    }
    state.edit = false;
    state.editStore = false;
    emitter.emit(state.events.PUSHSTATE, state.siteRoot + '?page=' + page.slug);
    emitter.emit(state.events.CHECK_CHANGED);
  });

  state.events.CHECK_CHANGED = 'checkChanged';
  emitter.on(state.events.CHECK_CHANGED, callback => {
    state.currentState = pack(state.p);
    state.changedSinceSave = state.lastSave !== state.currentState;
    emitter.emit(state.events.RENDER, callback);
  });

  state.events.SAVE_WIKI = 'saveWiki';
  emitter.on('saveWiki', async () => {
    const output = `<!DOCTYPE html><html lang=en><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${state.p.name}</title>${state.p.desc ? '<meta name="description" content="' + state.p.desc.replace(/"/g, '\\"') + '">' : ''}
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