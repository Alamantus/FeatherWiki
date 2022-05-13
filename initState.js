import { decompress } from 'json-compress';
import { hashObject } from './helpers/hashString';

export const initState = state => {
  state.siteRoot = location.pathname;
  if (state.siteRoot.length < 1) state.siteRoot = '/';
  state.showSidebar = false;
  state.sbTab = 'Pages';
  state.recent = [];
  state.showNewPageField = false;
  state.edit = false;
  state.editStore = null;
  state.showSource = false;
  state.help = {
    slugify: s => s.toLowerCase().replace(/\s/g, '_').replace(/\W/g, '-'),
    find: (s, a = 'slug') => state.p.pages.find(p => p[a] === s),
    getPage: () => {
      const { query, help, p } = state;
      return (!query.page && p.home) ? help.find(p.home, 'id') : help.find(query.page);
    },
    getParent: p => state.p.pages.find(pg => pg.id === p?.parent),
    getChildren: p => state.p.pages.filter(pg => pg.parent === p?.id),
    breadcrumb: p => {
      const b = [];
      let parent = state.help.getParent(p);
      while (parent) {
        b.push(parent);
        parent = state.help.getParent(parent);
      }
      return b;
    },
    formatDate: d => {
      const pad = s => s.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${d.getHours() % 12}:${pad(d.getMinutes())} ${d.getHours() / 12 < 1 ? 'a' : 'p'}m`;
    },
  };

  state.events = {
    ...state.events,
    HANDLE_404: '404',
    SHOW_NEW_PAGE_FIELD: 'snpf',
    CREATE_PAGE: 'cp',
    START_EDIT: 'se',
    UPDATE_PAGE: 'up',
    DELETE_PAGE: 'dp',
    COLLECT_TAGS: 'ct',
    CHECK_CHANGED: 'cc',
    SAVE_WIKI: 'sw',
  };

  state.a = document.getElementById('a').innerHTML;
  state.s = document.getElementById('s').innerHTML;
  state.c = document.getElementById('c')?.innerHTML ?? '';
  try {
    state.p = decompress(JSON.parse(document.getElementById('p').innerHTML));
  } catch (e) {
    state.p = {name:'New Wiki',desc:'',pages:[],img:{}};
  }
  state.pg = state.help.getPage();
  state.t = []; // all used tags
  state.lastSave = hashObject(state.p);
  state.currentState = state.lastSave;
  state.changedSinceSave = false;

  return state;
}