import { decompress, pack } from 'json-compress';

export const initState = state => {
  state.siteRoot = state.href.substring(state.href.lastIndexOf('/'));
  if (state.siteRoot.length < 1) state.siteRoot = '/';
  state.showSidebar = false;
  state.showNewPageField = false;
  state.edit = false;
  state.editStore = '';
  state.help = {
    slugify: s => s.toLowerCase().replace(/\s/g, '_').replace(/\W/g, '-'),
    findPage: s => state.p.pages.find(p => p.slug === s),
    getPage: () => {
      const { query, help } = state;
      return help.findPage(query.page);
    },
  };

  state.a = document.getElementById('a').innerHTML;
  state.s = document.getElementById('s').innerHTML;
  try {
    state.p = decompress(JSON.parse(document.getElementById('p').innerHTML));
  } catch (e) {
    state.p = {name:'New Wiki',desc:'',pages:[]};
  }
  state.pg = state.help.getPage();
  state.lastSave = pack(state.p);
  state.currentState = state.lastSave;
  state.changedSinceSave = false;

  return state;
}