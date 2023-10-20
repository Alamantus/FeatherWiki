/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
import { handleTab } from './helpers/handleTab';

export const initEmitter = (state, emitter) => {
  const { events, help, root, views } = state;
  const emit = (...args) => emitter.emit(...args);
  const title = () => emit(events.TITLE, state.p.name + (state.pg ? ' | ' + state.pg.name : ''));
  const tab = () => setTimeout(() => document.querySelectorAll('textarea:not(.notab)').forEach(t => t.onkeydown = handleTab), 300);
  
  const keepEditing = () => state.edits && !confirm('Lose unsaved changes?'); // True if editing & clicks cancel
  const stopEdit = () => { // Shave off more bytes
    state.edit = false;
    state.edits = null;
  };

  emitter.on(events.ONLOAD, () => {
    emit(events.HANDLE_404);
    title();
    emit(events.COLLECT_TAGS);
    if (state.t.length) emit(events.RENDER);
    else tab();
    if (process.env.SERVER) {
      emit(events.DETECT_PUT_SUPPORT);
    }
  });

  emitter.on(events.RENDER, tab);

  emitter.on(events.HANDLE_404, () => {
    const { page } = state.query;
    if (page?.length > 1) {
      const slug = FW.slug(page);
      const pg = help.find(slug);
      if (!pg && !views[slug]) {
        const name = page.split('_').map(w => w[0].toUpperCase() + w.substring(1)).join(' ');
        emit(events.CREATE_PAGE, name, false);
      }
    } else if (page?.length > 0 && !views[page]) {
      state.pg = { e: true, name: '404', content: '<p>Page not found</p>'};
      emit(events.RENDER);
    }
  });

  emitter.on(events.GO, () => {
    const { p, pg } = state;
    const slug = state.query.page ?? null;
    const isSame = pg?.slug === slug || (!slug && pg?.id === p.home);
    // Prevent navigation if editing and they don't confirm
    if (!isSame && keepEditing()) return history.go(-1);
    if (isSame) return;
    stopEdit();
    state.pg = help.getPage();
    emit(events.HANDLE_404);
    title();
  });

  emitter.on(events.CREATE_PAGE, (name, save = true) => {
    if (name.length < 2) return;
    if (keepEditing()) return;
    stopEdit();
    const { p, query } = state;

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
      s = FW.slug(name),
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
      state.recent = [{ p: newPg.id, t: newPg.cd }, ...state.recent].filter(p => !!p.p);
      emit(events.CHECK_CHANGED);
      emit(events.GO, root + '?page=' + slug, query.page !== slug ? 'replace' : 'push');
    } else {
      state.pg = newPg;
    }
    emit(events.START_EDIT);
  });

  emitter.on(events.START_EDIT, () => {
    const { pg } = state;
    state.edit = true;
    const store = {
      name: pg.name ?? '',
      slug: pg.slug ?? '',
      content: FW.img.fix(pg.content ?? ''),
      tags: pg.tags ?? '',
      parent: pg.parent ?? '',
      hide: !!pg.hide,
    };
    // Use markdown if: the page is already using it or it's a new page and the last saved page used it
    store.useMd = pg.editor === 'md' || (!store.content && state.useMd);
    state.edits = store;
    state.src = false;
    emit(events.RENDER);
  });

  emitter.on(events.CANCEL_EDIT, () => {
    if (keepEditing()) return;
    stopEdit();
    emit(events.RENDER);
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
    state.recent = [{ p: page.id, t: page.md }, ...state.recent.filter(p => p.p !== page.id)].filter(p => !!p.p);
    stopEdit();
    state.useMd = page.editor === 'md';
    emit(events.COLLECT_TAGS);
    state.pg = help.getPage();
    emit(events.CHECK_CHANGED);
  });

  emitter.on(events.DELETE_PAGE, id => {
    state.p.pages = state.p.pages.map(pg => {
      if (pg.parent === id) delete pg.parent;
      return pg;
    }).filter(pg => pg.id !== id);
    state.recent = state.recent.filter(p => p.p !== id);
    stopEdit();
    emit(events.COLLECT_TAGS);
    delete state.pg;
    emit(events.GO, root);
    emit(events.CHECK_CHANGED);
  });

  emitter.on(events.COLLECT_TAGS, () => {
    state.t = FW.tidy(state.p.pages.reduce((r, p) => {
      return [...r, ...(p.tags?.split(',') ?? [])];
    }, []));
  });

  emitter.on(events.CHECK_CHANGED, callback => {
    state.now = FW.hash.object(state.p);
    state.changed = state.prev !== state.now;
    emit(events.RENDER, callback);
  });

  emitter.on(events.NOTIFY, (text, time = 5000, css = 'background:#ddd; color:#000') => {
    const i = Date.now();
    const rm = () => emit(events.REMOVE_NOTI, i);
    const n = html`<div class=noti style="${css}" id="${i}" onclick=${() => rm()} title="Click to close">
      <span role=alert>${text}</span><span class=fr>×</span>
    </div>`;
    state.notis[i] = n;
    if (time > 0) setTimeout(rm, time);

    document.querySelector('.notis').appendChild(n);
  });

  emitter.on(events.REMOVE_NOTI, i => {
    const e = state.notis[i];
    e?.parentNode.removeChild(e);
    delete state.notis[i];
  });

  emitter.on(events.SAVE_WIKI, () => {
    const output = FW.gen(state);
    const { p } = state;
    const el = document.createElement('a');
    el.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(output));
    const filename = /\/$/.test(root) ? 'index.html' : decodeURI(root.substring(root.lastIndexOf('/') + 1));
    el.setAttribute('download', filename);
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);

    if (!process.env.SERVER) {
      // Only clear the "save needed" indicator on server save
      state.prev = FW.hash.object(p);
      emit(events.CHECK_CHANGED);
    }
  });

  if (process.env.SERVER) {
    emitter.on(events.PUT_SAVE_WIKI, () => {
      const output = FW.gen(state);
      const { p } = state;
      fetch(root, { method: 'PUT', body: output })
        .then(resp => resp.text()
          .then(text => ({ ok: resp.ok, status: resp.status, text: text }))
        )
        .then(result => {
          if (!result.ok) throw result.text ? result.text : `Status ${result.status}.`
          emit(events.NOTIFY, 'Saved.')

          state.prev = FW.hash.object(p);
          emit(events.CHECK_CHANGED);
        })
        .catch(err => {
          emit(events.NOTIFY, `Save failed! ${err}`, 9999, 'background:#e88');
        });
    });

    emitter.on(events.DETECT_PUT_SUPPORT, () => {
      // Assumptions:
      // * build make process.env.SERVER === true
      // * This only needs to run once at startup
      // * There's no need to turn it off again once it's set
      // * If any 'dav' header is present then a put save could work
      if (!location.protocol.startsWith('http') || state.canSave) return;
      fetch(root, { method: 'OPTIONS' })
        .then(resp => {
          if (resp.ok && resp.headers.get('dav')) {
            state.canSave = true;
            emit(events.RENDER);
          } else {
            emit(events.NOTIFY, 'Cannot save to server.', 9999, 'background:#e88');
          }
        })
        .catch(err => {})
    });
  }

  return emitter;
}
