/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension adds a very simple word count display below 
FW.ready(() => {
  const { state } = FW;
  state.wordCountDebounce = null;
  FW.emitter.on('render', () => showCount());
  function showCount() {
    if (!state.edits) return false;
    clearTimeout(state.wordCountDebounce);
    setTimeout(() => {
      let display = document.querySelector('#wordCount');
      if (!display) {
        const input = document.querySelector('textarea, .ed');
        display = html`<div id="wordCount"></div>`;
        input.after(display);
      }
      display.innerHTML = 'Word Count: ' + countWords();
    }, 500);
  }
  function countWords() {
    const { content, editor } = state.edits;
    let textContent = '';
    if (content) {
      const contentHtml = (html`<div></div>`);
      contentHtml.innerHTML = FW.inject.pg((typeof md !== 'undefined' && editor === 'md') ? md(content) : content, state);
      textContent = contentHtml.innerText.trim();
    }
    textContent = textContent.replace(/&mdash;|[—\s]*/gs, ' ');
    const words = textContent.split(' ').filter(w => w.replace(/\W/g, '').trim());
    return words.length;
  }
});
