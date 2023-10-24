/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
import { pagesView } from './views/pages';
import { settingsView } from './views/settings';
import { taggedView } from './views/tagged';
import { pageView } from './views/page';
import { missingView } from './views/missing';

export const initState = state => {
  state.root = location.pathname || '/'; // path to file
  state.sb = false; // show sidebar
  state.sbTab = 'Pages';
  state.sbx = new Set(); // expanded sidebar menu items
  state.recent = [];
  state.edit = false;
  state.edits = null; // Edit store
  state.keep = false; // Keep Editor, Prevent navigation if editing
  state.src = false; // Show HTML in editor
  state.notis = {}; // Notifications
  if (process.env.SERVER) {
    state.canSave = false; // Show "Save Wiki to Server" button
  }
  state.help = { // Helper functions that use state to do various things
    find: (s, a = 'slug') => state.p.pages.find(p => p[a] === s),
    getPage: () => {
      const { query, help, p } = state;
      return (!query.page && p.home) ? help.find(p.home, 'id') : help.find(query.page);
    },
    getParent: p => state.p.pages.find(pg => pg.id === p?.parent),
    getChildren: (p, hide) => state.p.pages.filter(pg => pg.parent === p?.id && (!hide || !pg.hide)),
    getChildList: (p, collapse) => {
      if (collapse && p.hide) return '';
      const { getChildren, getChildList } = state.help;
      const children = getChildren(p, collapse);
      const current = state.pg?.slug;
      const isCurrent = current === p.slug;
      // Expand if the menu item is the current page, if it was opened manually, or if one of its children is the current page
      const expand = (ch) => isCurrent || state.sbx.has(p.id) || (ch.find(c => c.slug === current || expand(getChildren(c, collapse))) ?? false);
      const link = [
        html`<a href="?page=${p.slug}" class=${isCurrent ? 'a' : ''}>${p.name}</a>`,
        children.length > 0
          ? html`<ul>${children.map(pg => getChildList(pg, collapse))}</ul>`
          : '',
      ]
      // If getChildList is passed with `collapse == true`, use a details element to allow collapsing the list
      const el = collapse && link[1]
        ? html`<details open=${expand(children)}
          onclick=${e => state.sbx.add(p.id)}
          ontoggle=${e => { if (!e.target.open) state.sbx.delete(p.id) }}
        >
          <summary>${link[0]}</summary>
          ${link[1]}
        </details>`
        : link;
      return html`<li>
        ${el}
      </li>`;
    },
    missing: () => state.p.pages.reduce((result, current) => {
      const c = document.createElement('div');
      c.innerHTML = FW.inject.pg(current.content);
      const newEl = [...c.getElementsByClassName('e')].filter(el => result.every(r => r.href !== el.href));
      return [...result, ...newEl];
    }, []).sort(),
    breadcrumb: p => {
      const b = [];
      let parent = state.help.getParent(p);
      while (parent) {
        b.unshift(parent);
        parent = state.help.getParent(parent);
      }
      return b;
    },
  };

  state.events = {
    ...state.events,
    HANDLE_404: '404',
    CREATE_PAGE: 'cp',
    START_EDIT: 'se',
    CANCEL_EDIT: 'ce',
    UPDATE_PAGE: 'up',
    DELETE_PAGE: 'dp',
    COLLECT_TAGS: 'ct',
    CHECK_CHANGED: 'cc',
    SAVE_WIKI: 'sw',
    NOTIFY: 'n',
    REMOVE_NOTI: 'rn',
  };
  if (process.env.SERVER) {
    state.events = {
      ...state.events,
      PUT_SAVE_WIKI: 'psw',
      DETECT_PUT_SUPPORT: 'dps',
    };
  }

  state.views = {
    a: pagesView,
    s: settingsView,
    t: taggedView,
    p: pageView,
    m: missingView
  };

  state.c = document.querySelector('style#c')?.innerHTML ?? '';
  state.j = document.querySelector('script#j')?.innerHTML ?? '';
  try {
    state.p = FW.json.decompress(JSON.parse(document.querySelector('script#p').innerHTML));
  } catch (e) {
    state.p = {name:'New Wiki',desc:'',pages:[],img:{}};
  }
  state.pg = state.help.getPage();
  
  // determine last-used editor
  const lastModified = state.p.pages.find(p => p.id === state.recent[0]?.p);
  state.useMd = lastModified?.editor === 'md';

  state.t = []; // all used tags
  state.prev = FW.hash.object(state.p); // Hash of state at last save
  state.now = state.prev; // Hash of current state
  state.changed = false; // Changed since last save?

  return state;
}