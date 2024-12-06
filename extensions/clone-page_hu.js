/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// Ez a kiterjesztés minden oldalon a „Szerkesztés” gomb mellé egy „Oldal klónozása” gombot helyez. Kattintson rá, adjon meg egy új nevet, és megjelenik az aktuális oldal másolata szerkesztésre.
FW.ready(() => {
  const { state, emitter } = FW;
  console.log('a clone-page.js futtatása');

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
      let newName = prompt('A Klónozott Oldal Neve:', pg.name + ' Klón');
      if (!newName) return;
      newName = newName.trim();
      if (newName.length < 2) return alert('Írjon be egynél több karaktert egy új oldal létrehozásához.');
      emitter.emit(state.events.CREATE_PAGE, newName);
      const wait = setInterval(() => {
        if (state.pg.id !== pg.id) {
          clearInterval(wait);
          state.pg = {...pg, ...state.pg};
          emitter.emit(state.events.START_EDIT);
        }
      }, 100);
    }}>Oldal Klónozása</button>`;
    editButton.parentElement.insertBefore(cloneButton, editButton.nextSibling);
  }
});
