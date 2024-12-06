/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// Ez a kiterjesztés a Feather Wiki Warbler verzióit automatikusan elmenti a szerverre, amikor az oldalakon változtatásokat végeznek.
FW.ready(() => {
  const { state, emitter } = FW;
  console.log('auto-save.js futtatása');
  const { events } = state;
  [events.UPDATE_PAGE, events.NOTIFY].forEach(ev => {
    emitter.on(ev, (noti = null) => {
      if (!state.canPut && noti !== 'Nem lehet automatikusan menteni') {
        emitter.emit(events.NOTIFY, 'Nem lehet automatikusan menteni', 5000, 'background:#e88');
        return;
      }
      if (typeof noti !== 'string' || noti === 'Settings updated') {
        emitter.emit(events.PUT_SAVE_WIKI);
      }
    });
  });
});
