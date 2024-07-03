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
  const { root, views } = state;
  const {
    ONLOAD, TITLE, RENDER, GO, HANDLE_404,
    CREATE_PAGE, START_EDIT, CANCEL_EDIT, UPDATE_PAGE, DELETE_PAGE,
    COLLECT_TAGS, CHECK_CHANGED, SAVE_WIKI, PUT_SAVE_WIKI, DETECT_PUT_SUPPORT,
    NOTIFY, REMOVE_NOTI,
  } = state.events;
  const emit = (...args) => emitter.emit(...args);
  const title = () => emit(TITLE, state.p.name + (state.pg ? ' | ' + state.pg.name : ''));
  const tab = () => setTimeout(() => document.querySelectorAll('textarea:not(.notab)').forEach(t => t.onkeydown = handleTab), 300);
  
  const keepEditing = () => state.edits && !confirm('{{translate:unsavedWarning}}'); // True if editing & clicks cancel
  const stopEdit = () => { // Shave off more bytes
    state.edit = false;
    state.edits = null;
  };

  emitter.on(ONLOAD, () => {
    emit(HANDLE_404);
    title();
    state.recent = state.p.pages.map(p => ({ p: p.id, t: p.md ?? p.cd })).sort((a, b) => a.t > b.t ? -1 : 1)
    emit(COLLECT_TAGS);
    if (state.t.length) emit(RENDER);
    else tab();

    emit(DETECT_PUT_SUPPORT);
  });

  emitter.on(RENDER, tab);

  emitter.on(HANDLE_404, () => {
    const { page } = state.query;
    if (page?.length > 1) {
      const slug = FW.slug(page);
      const pg = FW.find(slug);
      if (!pg && !views[slug]) {
        const name = page.split('_').map(w => w[0].toUpperCase() + w.substring(1)).join(' ');
        emit(CREATE_PAGE, name, false);
      }
    } else if (page?.length > 0 && !views[page]) {
      state.pg = { e: true, name: '404', content: '<p>{{translate:pageNotFound}}</p>'};
      emit(RENDER);
    }
  });

  emitter.on(GO, () => {
    const { p, pg } = state;
    const slug = state.query.page ?? null;
    const isSame = pg?.slug === slug || (!slug && pg?.id === p.home);
    // Prevent navigation if editing and they don't confirm
    if (!isSame && keepEditing()) return history.go(-1);
    if (isSame) return;
    stopEdit();
    state.pg = FW.getPage();
    emit(HANDLE_404);
    title();
  });

  emitter.on(CREATE_PAGE, (name, save = true) => {
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
      state.recent.unshift({ p: newPg.id, t: newPg.cd });
      emit(CHECK_CHANGED);
      emit(GO, root + '?page=' + slug, query.page !== slug ? 'replace' : 'push');
    } else {
      state.pg = newPg;
    }
    emit(START_EDIT);
  });

  emitter.on(START_EDIT, () => {
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
    emit(RENDER);
  });

  emitter.on(CANCEL_EDIT, () => {
    if (keepEditing()) return;
    stopEdit();
    emit(RENDER);
  });

  emitter.on(UPDATE_PAGE, (page) => {
    const { p } = state;
    if (p.pages.some(pg => pg.slug === page.slug && pg.id !== page.id)) {
      return alert(`{{translate:slugExists}}`);
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
    state.recent = [{ p: page.id, t: page.md }, ...state.recent.filter(p => p.p !== page.id)];
    stopEdit();
    state.useMd = page.editor === 'md';
    emit(COLLECT_TAGS);
    state.pg = FW.getPage();
    emit(CHECK_CHANGED);
  });

  emitter.on(DELETE_PAGE, id => {
    state.p.pages = state.p.pages.map(pg => {
      if (pg.parent === id) delete pg.parent;
      return pg;
    }).filter(pg => pg.id !== id);
    state.recent = state.recent.filter(p => p.p !== id);
    stopEdit();
    emit(COLLECT_TAGS);
    delete state.pg;
    emit(GO, root);
    emit(CHECK_CHANGED);
  });

  emitter.on(COLLECT_TAGS, () => {
    state.t = FW.tidy(state.p.pages.reduce((r, p) => {
      return [...r, ...(p.tags?.split(',') ?? [])];
    }, []));
  });

  emitter.on(CHECK_CHANGED, callback => {
    state.now = FW.hash.object(state.p);
    state.changed = state.prev !== state.now;
    emit(RENDER, callback);
  });

  emitter.on(NOTIFY, (text, time = 5000, css = 'background:#ddd; color:#000') => {
    const i = Date.now();
    const rm = () => emit(REMOVE_NOTI, i);
    const n = html`<div class=noti style="${css}" id="${i}" onclick=${() => rm()} title="{{translate:clickToClose}}">
      <span role=alert>${text}</span><span class=fr>×</span>
    </div>`;
    state.notis[i] = n;
    if (time > 0) setTimeout(rm, time);

    document.querySelector('.notis').appendChild(n);
  });

  emitter.on(REMOVE_NOTI, i => {
    const e = state.notis[i];
    e?.parentNode.removeChild(e);
    delete state.notis[i];
  });

  emitter.on(SAVE_WIKI, () => {
    const output = FW.gen(state);
    const { p } = state;
    const el = document.createElement('a');
    el.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(output));
    const filename = /\/$/.test(root) ? 'index.html' : decodeURI(root.substring(root.lastIndexOf('/') + 1));
    el.setAttribute('download', filename);
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);

    if (!state.canPut) {
      // Only clear the "save needed" indicator on server save
      state.prev = FW.hash.object(p);
      emit(CHECK_CHANGED);
    }
  });

  emitter.on(PUT_SAVE_WIKI, () => {
    const output = FW.gen(state);
    const { p } = state;
    fetch(root, { method: 'PUT', body: output })
      .then(resp => resp.text()
        .then(text => ({ ok: resp.ok, status: resp.status, text: text }))
      )
      .then(result => {
        if (!result.ok) throw result.text ? result.text : `{{translate:status}} ${result.status}.`
        emit(NOTIFY, '{{translate:saved}}')

        state.prev = FW.hash.object(p);
        emit(CHECK_CHANGED);
      })
      .catch(err => {
        emit(NOTIFY, `{{translate:saveFailed}} ${err}`, 9999, 'background:#e88');
      });
  });

  emitter.on(DETECT_PUT_SUPPORT, () => {
    // Assumptions:
    // * This only needs to run once at startup
    // * There's no need to turn it off again once it's set
    // * If any 'dav' header is present then a put save could work
    if (!location.protocol.startsWith('http') || state.canPut) return;
    fetch(root, { method: 'OPTIONS' })
      .then(resp => {
        if (resp.ok && resp.headers.get('dav')) {
          state.canPut = true;
          emit(RENDER);
        }
      })
      .catch(err => {})
  });

  return emitter;
}
