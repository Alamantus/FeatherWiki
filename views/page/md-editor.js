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

export const editor = (state) => {
  const textChange = (event) => {
    state.edits.content = event.target.value;
    preview.innerHTML = md(state.edits.content);
  }
  const element = html`<textarea oninput=${textChange}>${state.edits.content}</textarea>`;
  const preview = html`<div id="preview" class="pell-content" style="display:none">${md(state.edits.content)}</div>`;
  return [
    element,
    preview,
    html`<button onclick=${e => {e.preventDefault(); preview.style.display = preview.style.display == "none" ? "block" : "none";}}>Preview</button>`,
    html`<button onclick=${e => {e.preventDefault(); FW.img.upload(state, insert)}}>Insert Image from File</button>`,
    html`<button onclick=${e => {e.preventDefault(); document.getElementById('g').showModal()}}>Add Existing Image</button>`,
    modal(state, insert),
  ];
  
  // Modified from https://stackoverflow.com/a/19961519
  function insert ({ id }) {
    const text = `![](img:${id}:img)`;
    if (document.activeElement !== element) element.focus();
    if (document.selection) {
      // IE
      const sel = document.selection.createRange();
      sel.text = text;
    } else if (element.selectionStart || element.selectionStart === 0) {
      // Others
      var startPos = element.selectionStart;
      var endPos = element.selectionEnd;
      element.value = element.value.substring(0, startPos) +
        text +
        element.value.substring(endPos, element.value.length);
      element.selectionStart = startPos + text.length;
      element.selectionEnd = startPos + text.length;
    } else {
      element.value += text;
    }
    textChange({ target: element });
  };
}
