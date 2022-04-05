import { decompress, pack } from 'json-compress';

export const initState = state => {
  state.a = document.getElementById('a').innerHTML;
  state.s = document.getElementById('s').innerHTML;
  try {
    state.p = decompress(JSON.parse(document.getElementById('p').innerHTML));
  } catch (e) {
    state.p = {title:'New Wiki',description:'',entries:[]};
  }
  state.lastSave = pack(state.p);
  state.currentState = state.lastSave;
  state.showSidebar = false;

  return state;
}