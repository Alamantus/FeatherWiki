/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension finds any content between double braces {{like_this}} and looks for a page with a matching
// slug. If found, the braced content will be replaced with the content of the target page within an `article`
// tag with a class of `transclusion` so it can be targeted and styled.
FW.ready(() => {
  const { state, emitter } = FW;
  ['DOMContentLoaded', 'render'].forEach(ev => {
    emitter.on(ev, () => {
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        linkImages();
      }, 50);
    });
  });
  emitter.emit('DOMContentLoaded');

  function linkImages() {
    if (state.pg) {
      Array.from(document.querySelectorAll('img')).forEach(img => {
        if (img.parentNode.tagName.toLowerCase() !== 'a') {
          const link = html`<a target="_blank" rel="noopener noreferrer" href="${img.src}" title="Open full size"></a>`;
          img.parentNode.insertBefore(link, img);
          link.appendChild(img);
        }
      });
    }
  }
});
