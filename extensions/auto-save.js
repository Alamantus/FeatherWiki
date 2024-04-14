/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension makes Warbler versions of Feather Wiki automatically save to the server when changes are made to pages
(function autoSaveExtension () {
  if (!window.FW._loaded) return setTimeout(autoSaveExtension, 1); // wait until FW is mounted
  const { state, emitter } = window.FW;
  console.log('running autoSaveExtension');
  const { events } = state;
  [events.UPDATE_PAGE, events.NOTIFY].forEach(ev => {
    emitter.on(ev, (noti = null) => {
      if (!state.canSave && !state.canPut) {
        emitter.emit(events.NOTIFY, 'Cannot autosave', 5000, 'background:#e88');
      } else if (typeof noti !== 'string' || noti === 'Settings updated') {
        emitter.emit(events.PUT_SAVE_WIKI);
      }
    });
  });
})();
