/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
import { modal } from '../gallery';

export const editor = (state, emit) => {
  const { init, exec } = pell; // From `window`
  const { src, edits } = state;
  const { content } = edits;
  let element = document.querySelector('#e');
  if (src) {
    element = html`<textarea onchange=${e => state.edits.content = e.target.value}>${FW.img.abbr(content)}</textarea>`;
  } else {
    if (!element) {
      const fb = 'formatBlock';
      element = init({
        element: html`<div id=e class=ed></div>`, // Setting id here helps prevent re-render when other fields are changed
        onChange: val => state.edits.content = val,
        insert: () => FW.img.upload(state, insert),
      });
      element.isSameNode = () => true; // Do not re-render editor
    }
    element.content.innerHTML = content.includes('<img ') ? FW.inject.img(content, state, true) : content;
  }

  return [
    element,
    html`<div class="w1 tr pb">
      <button onclick=${toggleShowSource}>${src ? 'Show Editor' : 'Show HTML'}</button>
    </div>`,
    modal(state, insert),
  ];

  function insert (i) {
    const editor = element.children[1];
    if (document.activeElement !== editor) editor.focus();
    exec('insertHTML', `<p><img src="${i.img}#${i.id}"></p>`);
  }

  function toggleShowSource (e) {
    e.preventDefault();
    state.src = !src;
    emit(state.events.RENDER);
  }
}
