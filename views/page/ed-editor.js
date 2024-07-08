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
  const { init } = ed; // From `window`
  const { src, edits } = state;
  const { content } = edits;
  let element;
  if (src) {
    element = html`<textarea onchange=${e => state.edits.content = e.target.value}>${FW.img.abbr(content)}</textarea>`;
  } else {
    element = init({
      onChange: val => state.edits.content = val,
    });
    element.isSameNode = () => true; // Do not re-render editor
    element.edUc.innerHTML = content.includes('<img ') ? FW.inject.img(content, true) : content;
  }

  return [
    element,
    html`<div class="w1 tr pb">
      <button type=button onclick=${() => { state.src = !src; emit(state.events.RENDER) }}>
        ${src ? '{{translate:showEditor}}' : '{{translate:showHtml}}'}
      </button>
    </div>`,
    modal(state, () => element.edUc?.img()),
  ];
}
