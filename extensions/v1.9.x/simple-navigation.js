/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension adds next/previous buttons to the bottom of your pages for navigating the the next/previous page in the Page Order as set in the Wiki Settings. It's not useful for every kind of Feather Wiki, but it's handy for certain use cases.
FW.ready(() => {
  const { state, emitter } = FW;
  console.log('running simple-navigation.js');

  ['DOMContentLoaded', 'render'].forEach(ev => {
    emitter.on(ev, () => {
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        renderNavigationButtons();
      }, 50);
    });
  });
  emitter.emit('DOMContentLoaded');

  function renderNavigationButtons () {
    if (!state.pg || state.edit || document.querySelector('#simpleNavigationExtension')) return;
    const { pages } = state.p;
    const pageIndex = pages.findIndex(p => p.id === state.pg.id);
    const buttons = [];
    if (pageIndex > 0) {
      const prevSlug = pages[pageIndex - 1].slug;
      buttons.push(html`<a href="?page=${prevSlug}">← Previous</a>`);
    }
    if (pageIndex < pages.length - 1) {
      const nextSlug = pages[pageIndex + 1].slug;
      buttons.push(html`<a href="?page=${nextSlug}" class=fr>Next →</a>`);
    }
    document.querySelector('main>section').appendChild(html`<footer id=simpleNavigationExtension style="padding:1rem 0;">${buttons}</footer>`);
  }
});
