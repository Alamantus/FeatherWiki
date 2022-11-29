/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension adds a "Clone Page" button next to the "Edit" button on every page. Click it, set a new name, and a copy of the current page will appear for editing.
(function clonePageExtension () {
  if (!window.FW._loaded) return setTimeout(clonePageExtension, 1); // wait until FW is mounted
  const { state, emitter } = window.FW;
  console.log('running clonePageExtension');

  ['DOMContentLoaded', 'render'].forEach(ev => {
    emitter.on(ev, () => {
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        renderClonePageButton();
      }, 50);
    });
  });
  emitter.emit('DOMContentLoaded');

  function renderClonePageButton () {
    const editButton = Array.from(document.querySelectorAll('main > section > header button')).find(el => el.textContent === 'Edit');
    if (!editButton || !!document.querySelector('#cloneButton')) return;
    const pg = { ...state.pg };
    const cloneButton = html`<button id="cloneButton" style="background-color:#fff;border:1px solid #000;color:#000;margin-left:8px;" onclick=${() => {
      let newName = prompt('Cloned Page Name:', pg.name + ' Clone');
      if (!newName) return;
      newName = newName.trim();
      if (newName.length < 2) return alert('Enter more than 1 character to create a new page.');
      emitter.emit(state.events.CREATE_PAGE, newName);
      const wait = setInterval(() => {
        if (state.pg.id !== pg.id) {
          clearInterval(wait);
          state.pg = {...pg, ...state.pg};
          emitter.emit(state.events.START_EDIT);
        }
      }, 100);
    }}>Clone Page</button>`;
    editButton.parentElement.insertBefore(cloneButton, editButton.nextSibling);
  }
})();
