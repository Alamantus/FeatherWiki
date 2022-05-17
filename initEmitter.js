import { compress } from 'json-compress';

import { hashObject } from './helpers/hashString';
import { views } from './views';

export const initEmitter = (state, emitter) => {
  const { events } = state;
  const title = () => emitter.emit(events.DOMTITLECHANGE, state.p.name + (state.pg ? ' | ' + state.pg.name : ''));

  emitter.on(events.DOMCONTENTLOADED, () => {
    emitter.emit(events.HANDLE_404);
    title();
    emitter.emit(events.COLLECT_TAGS);
  });

  emitter.on(events.RENDER, callback => {
    if (typeof callback === 'function') setTimeout(callback, 100);
  });

  emitter.on(events.HANDLE_404, () => {
    const { page } = state.query;
    if (page?.length > 1) {
      const { help, events } = state;
      const slug = help.slugify(page);
      const pg = help.find(slug);
      if (!pg && !views[slug]) {
        const name = page.split('_').map(w => w[0].toUpperCase() + w.substring(1)).join(' ');
        emitter.emit(events.CREATE_PAGE, name, false);
      }
    } else if (page?.length > 0 && !views[page]) {
      state.pg = { e: true, name: '404', content: '<p>Page not found</p>'};
      emitter.emit(events.RENDER);
    }
  });

  emitter.on(events.NAVIGATE, () => {
    state.edit = false;
    state.editStore = '';
    state.pg = state.help.getPage();
    state.recent = [{ p: state.pg?.id, t: Date.now() }, ...state.recent.filter(p => p.p !== state.pg?.id)].filter(p => !!p.p);
    emitter.emit(events.HANDLE_404);
    title();
  });

  emitter.on(events.SHOW_NEW_PAGE_FIELD, () => {
    state.showNewPageField = true;
    emitter.emit(events.RENDER, () => {
      document.getElementById('newPageField').focus();
    });
  });

  emitter.on(events.CREATE_PAGE, (name, save = true) => {
    if (name.length < 1) return;
    const { p, help, events, query, siteRoot } = state;

    const genId = () => {
      const s = [];
      for (let i = 0; i < 9; i++) {
        const code = Math.round(Math.random() * (126 - 32)) + 32;
        s.push(String.fromCharCode(code));
      }
      return s.join('');
    }
    let id;
    do {
      id = genId();
    }
    while (p.pages.findIndex(p => p.id === id) >= 0);
    // Ensure unique slug
    let d = 0,
      s = help.slugify(name),
      slug;
    do {
      slug = s + (d > 0 ? '_' + d : '');
      d++;
    }
    while (p.pages.some(pp => pp.slug === slug))
    const newPg = { id, name, slug, cd: Date.now() };
    state.showNewPageField = false;

    if (save) {
      state.p.pages.push(newPg);
      emitter.emit(events.CHECK_CHANGED);
      emitter.emit(events[query.page !== slug ? 'REPLACESTATE' : 'PUSHSTATE'], siteRoot + '?page=' + slug);
    } else {
      state.pg = newPg;
    }
    emitter.emit(events.START_EDIT);
  });

  emitter.on(events.START_EDIT, () => {
    const { pg } = state;
    state.edit = true;
    const store = {
      name: pg.name ?? '',
      slug: pg.slug ?? '',
      content: pg.content ?? '',
      tags: pg.tags ?? '',
      parent: pg.parent ?? '',
    };
    if (process.env.EDITOR !== 'html') {
      state.editStore.useMd = pg.editor === 'md' || state.useMd;
    }
    state.editStore = store;
    state.showSource = false;
    emitter.emit(events.RENDER);
  });

  emitter.on(events.UPDATE_PAGE, (page) => {
    const { p } = state;
    if (p.pages.some(pg => pg.slug === page.slug && pg.id !== page.id)) {
      return alert('A page with the slug "' + page.slug + '" already exists!');
    }
    const pIndex = p.pages.findIndex(pg => pg.id === page.id);
    Object.keys(page).forEach(key => {
      if (page[key].length < 1) delete page[key];
    })
    page.md = Date.now();
    if (pIndex > -1) {
      p.pages[pIndex] = page;
    } else {
      p.pages.push(page);
    }
    state.edit = false;
    state.editStore = null;
    if (process.env.EDITOR !== 'html') state.useMd = page.editor === 'md';
    emitter.emit(events.COLLECT_TAGS);
    emitter.emit(events.PUSHSTATE, state.siteRoot + '?page=' + page.slug);
    emitter.emit(events.CHECK_CHANGED);
  });

  emitter.on(events.DELETE_PAGE, id => {
    state.p.pages = state.p.pages.map(pg => {
      if (pg.parent === id) delete pg.parent;
      return pg;
    }).filter(pg => pg.id !== id);
    state.edit = false;
    state.editStore = null;
    emitter.emit(events.COLLECT_TAGS);
    emitter.emit(events.PUSHSTATE, state.siteRoot);
    emitter.emit(events.CHECK_CHANGED);
  });

  emitter.on(events.COLLECT_TAGS, () => {
    state.t = state.help.tidyArray(state.p.pages.reduce((r, p) => {
      return [...r, ...(p.tags?.split(',') ?? [])];
    }, []));
  });

  emitter.on(events.CHECK_CHANGED, callback => {
    state.currentState = hashObject(state.p);
    state.changedSinceSave = state.lastSave !== state.currentState;
    emitter.emit(events.RENDER, callback);
  });

  emitter.on(events.SAVE_WIKI, () => {
    const { a, s, c, p, siteRoot } = state;
    const output = `<!DOCTYPE html>
    <html lang=en>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${p.name}</title>
      ${p.desc ? '<meta name="description" content="' + p.desc.replace(/"/g, '\\"') + '">' : ''}
      <meta name="version" content="{{package.json:version}}" />
      <style id="s">${s}</style>
      ${c ? `<style id=c>${c}</style>` : '' }
    </head>
    <body>
      <a href="https://codeberg.org/Alamantus/FeatherWiki#supported-browsers">JavaScript</a> is required
      <script id="p" type="application/json">${JSON.stringify(compress(p))}</script>
      <script id="a">${a}</script>
    </body>
    </html>`;
    const filename = /\/$/.test(siteRoot) ? 'index.html' : siteRoot.substring(siteRoot.lastIndexOf('/') + 1);
    const el = document.createElement('a');
    el.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(output));
    el.setAttribute('download', filename);
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);

    state.lastSave = hashObject(p);
    emitter.emit(events.CHECK_CHANGED);
  });

  return emitter;
}
