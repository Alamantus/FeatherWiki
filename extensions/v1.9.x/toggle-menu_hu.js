/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// Ez a kiterjesztés hozzáad egy gombot, amely a mobil nézeten kívül váltja az oldalsáv láthatóságát.
// Az oldalsáv alapértelmezett állapotának beállítása a `window.toggleSidebarHiddenDefault = true` segítségével lehetséges.
// A kapcsoló gomb eltávolítása a `window.toggleSidebarButtonHidden = true` kapcsolóval lehetséges.
FW.ready(() => {
  const { state, emitter } = FW;
  console.log('a toggle-menu.js futtatása');
  state.sidebarHidden = window.toggleSidebarHiddenDefault ?? false;
  state.hideToggleButton = window.toggleSidebarButtonHidden ?? false;
  ['DOMContentLoaded', 'render'].forEach(ev => {
    emitter.on(ev, () => {
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        renderSidebarToggleState();
        renderToggleSidebarButton();
      }, 50);
    });
  });
  emitter.emit('DOMContentLoaded');

  function renderToggleSidebarButton () {
    if (state.hideToggleButton || !!document.getElementById('toggleSidebar')) return;
    const btn = html`<div id=toggleSidebar style="${state.sidebarHidden ? 'left:0;' : ''}">
      <button title="${state.sidebarHidden ? 'Menü Megjelenítése' : 'Menü Elrejtése'}"
        onclick=${() => {
          state.sidebarHidden = !state.sidebarHidden;
          emitter.emit('render');
        }}
      >
        ${state.sidebarHidden ? '↦' : '⇤'}
      </button>
      <style>
        #toggleSidebar { display: none; }
        @media(min-width:50rem) {
          #toggleSidebar {
            display: unset;
            position: fixed;
            top: 0;
            left: 19%;
            z-index: 9;
          }
          #toggleSidebar button {
            padding: 5px;
          }
        }
        @media(min-width:2500px) {
          #toggleSidebar { left: 490px; }
        }
      </style>
    </div>`;
    const main = document.querySelector('main');
    main.parentNode.appendChild(btn);
  }

  function renderSidebarToggleState() {
    if (state.sidebarHidden) {
      document.querySelector('main>.sb').setAttribute('style', 'display:none!important');
      document.querySelector('main>section').style.paddingLeft = '2.5rem';
    }
  }
});
