import { decompress } from 'json-compress';
import { hashObject } from './helpers/hashString';

export const initState = state => {
  state.siteRoot = state.href.substring(state.href.lastIndexOf('/'));
  if (state.siteRoot.length < 1) state.siteRoot = '/';
  state.showSidebar = false;
  state.showNewPageField = false;
  state.edit = false;
  state.editStore = null;
  state.showSource = false;
  state.help = {
    slugify: s => s.toLowerCase().replace(/\s/g, '_').replace(/\W/g, '-'),
    findPage: s => state.p.pages.find(p => p.slug === s),
    getPage: () => {
      const { query, help } = state;
      return help.findPage(query.page);
    },
  };

  state.events = {
    ...state.events,
    HANDLE_404: '404',
    SHOW_NEW_PAGE_FIELD: 'snpf',
    CREATE_PAGE: 'cp',
    START_EDIT: 'se',
    UPDATE_PAGE: 'up',
    COLLECT_TAGS: 'ct',
    CHECK_CHANGED: 'cc',
    SAVE_WIKI: 'sw',
  };

  state.a = document.getElementById('a').innerHTML;
  state.s = document.getElementById('s').innerHTML;
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