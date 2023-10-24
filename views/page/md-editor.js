/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
import { parseContent } from './display';
import { modal } from '../gallery';

export const editor = (state) => {
  const preview = html`<div class="ed ed-content" style="display:none"></div>`;
  const textChange = (event) => {
    state.edits.content = event.target.value;
    clearTimeout(state.debounce);
    state.debounce = setTimeout(() => {
      preview.innerHTML = parseContent({ ...state.edits, editor: 'md' });
    }, 500);
  }
  const edit = html`<textarea oninput=${textChange}>${state.edits.content}</textarea>`;
  textChange({ target: edit });
  return [
    edit,
    preview,
    html`<button onclick=${e => {e.preventDefault(); preview.style.display = preview.style.display == 'none' ? 'block' : 'none';}}>Preview</button>`,
    html`<button onclick=${e => {e.preventDefault(); FW.img.upload(state, insert)}}>Insert Image from File</button>`,
    html`<button onclick=${e => {e.preventDefault(); document.getElementById('g').showModal()}}>Add Existing Image</button>`,
    modal(state, insert),
  ];
  
  // Modified from https://stackoverflow.com/a/19961519
  function insert ({ id }) {
    const text = `![](img:${id}:img)`;
    if (document.activeElement !== edit) edit.focus();
    if (document.selection) {
      // IE
      const sel = document.selection.createRange();
      sel.text = text;
    } else if (edit.selectionStart || edit.selectionStart === 0) {
      // Others
      var startPos = edit.selectionStart;
      var endPos = edit.selectionEnd;
      edit.value = edit.value.substring(0, startPos) +
        text +
        edit.value.substring(endPos, edit.value.length);
      edit.selectionStart = startPos + text.length;
      edit.selectionEnd = startPos + text.length;
    } else {
      edit.value += text;
    }
    textChange({ target: edit });
  };
}
