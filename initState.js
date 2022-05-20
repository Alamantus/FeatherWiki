import { hashObject } from './helpers/hashString';
import { decompress } from './helpers/jsonCompress';

export const initState = state => {
  state.root = location.pathname; // Site Root
  if (state.root.length < 1) state.root = '/';
  state.sb = false; // show sidebar
  state.sbTab = 'Pages';
  state.recent = [];
  state.edit = false;
  state.edits = null; // Edit store
  state.keep = false; // Keep Editor, Prevent navigation if editing
  state.src = false; // Show HTML in editor
  state.help = { // Helper functions that use state to do various things
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
  };

  state.events = {
    ...state.events,
    HANDLE_404: '404',
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
  state.prev = hashObject(state.p); // Hash of state at last save
  state.now = state.prev; // Hash of current state
  state.changed = false; // Changed since last save?

  return state;
}