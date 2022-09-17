/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
export const initEmitter = (state, emitter) => {
  const { events, views } = state;
  const emit = (...args) => emitter.emit(...args);
  const title = () => emit(events.DOMTITLECHANGE, state.p.name + (state.pg ? ' | ' + state.pg.name : ''));
  const keepEditing = () => state.edits && !confirm('Lose unsaved changes?'); // True if editing & clicks cancel
  const stopEdit = () => { // Shave off more bytes
    state.edit = false;
    state.edits = null;
  };

  emitter.on(events.DOMCONTENTLOADED, () => {
    emit(events.HANDLE_404);
    title();
    emit(events.COLLECT_TAGS);
    if (state.t.length) emit(events.RENDER);
    if (process.env.SERVER) {
      emit(events.DETECT_PUT_SUPPORT);
    }
  });

  emitter.on(events.RENDER, callback => {
    if (typeof callback === 'function') setTimeout(callback, 100);
  });

  emitter.on(events.HANDLE_404, () => {
    const { page } = state.query;
    if (page?.length > 1) {
      const { help, events } = state;
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

  emitter.on(events.NAVIGATE, () => {
    // Prevent navigation if editing and they don't confirm
    if (!state.keep && keepEditing()) {
      state.keep = true;
      return history.go(-1);
    }
    if (!state.keep) {
      stopEdit();
      state.pg = state.help.getPage();
      state.recent = [{ p: state.pg?.id, t: Date.now() }, ...state.recent.filter(p => p.p !== state.pg?.id)].filter(p => !!p.p);
      emit(events.HANDLE_404);
      title();
      window.scroll(0, 0);
    } else {
      state.keep = false;
    }
  });

  emitter.on(events.CREATE_PAGE, (name, save = true) => {
    if (name.length < 2) return;
    if (keepEditing()) return;
    stopEdit();
    const { p, events, query, root } = state;

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
      emit(events.CHECK_CHANGED);
      emit(events[query.page !== slug ? 'REPLACESTATE' : 'PUSHSTATE'], root + '?page=' + slug);
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
      content: pg.content ?? '',
      tags: pg.tags ?? '',
      parent: pg.parent ?? '',
      hide: !!pg.hide,
    };
    if (process.env.EDITOR !== 'html') {
      if (process.env.EDITOR === 'md') {
        store.useMd = true;
      } else {
        store.useMd = pg.editor === 'md' || state.useMd;
      }
    }
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
    stopEdit();
    if (process.env.EDITOR !== 'html') {
      state.useMd = page.editor === 'md';
    }
    emit(events.COLLECT_TAGS);
    emit(events.PUSHSTATE, state.root + '?page=' + page.slug);
    emit(events.CHECK_CHANGED);
  });

  emitter.on(events.DELETE_PAGE, id => {
    state.p.pages = state.p.pages.map(pg => {
      if (pg.parent === id) delete pg.parent;
      return pg;
    }).filter(pg => pg.id !== id);
    stopEdit();
    emit(events.COLLECT_TAGS);
    emit(events.PUSHSTATE, state.root);
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
    const id = FW.hash.string(text + css + (state.notis.length + 1));
    const n = {
      text,
      css,
      id,
      t: time > 0 ? setTimeout(() => emit(events.REMOVE_NOTI, id), time) : null,
    };
    state.notis.push(n);
    emit(events.RENDER);
  });

  emitter.on(events.REMOVE_NOTI, id => {
    state.notis.splice(state.notis.findIndex(n => n.id === id), 1);
    emit(events.RENDER);
  });

  emitter.on(events.SAVE_WIKI, () => {
    const output = FW.gen(state);
    const { p, root } = state;
    const filename = /\/$/.test(root) ? 'index.html' : root.substring(root.lastIndexOf('/') + 1);
    const el = document.createElement('a');
    el.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(output));
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
      const { p, root } = state;
      fetch(root, { method: 'PUT', body: output })
        .then(resp => resp.text()
          .then(text => ({ ok: resp.ok, status: resp.status, text: text }))
        )
        .then(result => {
          if (!result.ok) throw result.text ? result.text : `Status ${result.status}.`
          emit(events.NOTIFY, 'Saved.')

          state.prev = FW.hash.object(p);
          emitter.emit(events.CHECK_CHANGED);
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
      if (!location.protocol.startsWith('http')) return;
      fetch(state.root, { method: 'OPTIONS' })
        .then(resp => {
          if (resp.ok && resp.headers.get('dav')) {
            state.canSave = true;
            emitter.emit(events.RENDER);
          } else {
            emit(events.NOTIFY, 'Cannot save to server.', 9999, 'background:#e88');
          }
        })
        .catch(err => {})
    });
  }

  return emitter;
}
