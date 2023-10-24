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
  const textChange = (e) => {
    state.edits.content = e.target.value;
    clearTimeout(state.debounce);
    state.debounce = setTimeout(() => {
      preview.innerHTML = parseContent({ ...state.edits, editor: 'md' });
    }, 500);
  }
  // Call this `target` to save some bytes when constructing objects
  const target = html`<textarea oninput=${textChange}>${state.edits.content}</textarea>`;
  textChange({ target });
  return [
    target,
    preview,
    html`<button onclick=${e => {e.preventDefault(); preview.style.display = preview.style.display == 'none' ? 'block' : 'none';}}>Preview</button>`,
    html`<button onclick=${e => {e.preventDefault(); FW.img.upload(state, insert)}}>Insert Image from File</button>`,
    html`<button onclick=${e => {e.preventDefault(); document.getElementById('g').showModal()}}>Add Existing Image</button>`,
    modal(state, insert),
  ];
  
  // Modified from https://stackoverflow.com/a/19961519
  function insert ({ id }) {
    const text = `![](img:${id}:img)`;
    if (document.activeElement !== target) target.focus();
    if (document.selection) {
      // IE
      const sel = document.selection.createRange();
      sel.text = text;
    } else if (target.selectionStart || target.selectionStart === 0) {
      // Others
      var startPos = target.selectionStart;
      var endPos = target.selectionEnd;
      target.value = target.value.substring(0, startPos) +
        text +
        target.value.substring(endPos, target.value.length);
      target.selectionStart = startPos + text.length;
      target.selectionEnd = startPos + text.length;
    } else {
      target.value += text;
    }
    textChange({ target });
  };
}
