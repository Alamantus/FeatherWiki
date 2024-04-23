/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension takes all heading elements (h1–8) and generates a table of contents if `<toc></toc>` is found in the page content.
FW.ready(() => {
  const { emitter } = FW;
  console.log('running table-of-contents.js'); // Indicate that the extension has been added
  // If you need to add variables to the Feather Wiki state, you can do so here
  // Make the extension run *both* when the page renders *and* when the page first loads
  ['DOMContentLoaded', 'render'].forEach(ev => {
    emitter.on(ev, () => {
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        renderTableOfContents();
      }, 50);
    });
  });
  emitter.emit('DOMContentLoaded'); // Ensure your extension renders

  function renderTableOfContents () {
    const uc = document.querySelector('.uc');
    if (!uc) return; // Don't run on non-user-created pages
    const tocMatch = /(<|&lt;)toc(>|&gt;)\s*(<|&lt;)\/toc(>|&gt;)/; // <toc></toc>
    if (!uc.innerHTML.match(tocMatch)) return; // Don't run if no placeholder exists
    const headers = Array.from(uc.querySelectorAll('h1,h2,h3,h4,h5,h6,h7,h8'));
    const biggestHeader = headers.reduce((top, h) => {
      const hNum = parseInt(h.nodeName.replace('H', ''));
      return hNum < top ? hNum : top;
    }, Infinity);
    let prev = 0;
    let content = '<ul>';
    headers.forEach(h => {
      const hNum = parseInt(h.nodeName.replace('H', ''));
      if (prev > 0) {
        if (hNum > prev) {
          content += '<ul>';
        } else {
          content += '</li>';
          if (hNum !== prev && hNum >= biggestHeader) {
            content += '</ul>';
            if (hNum < prev) content += '</li>';
          }
        }
      }
      content += `<li><a href="#${h.id}">${h.innerText.trim()}</a>`;
      prev = hNum;
    });
    for (let i = 0; i <= (prev - biggestHeader); i++) {
      content += '</li></ul>';
    }
    const regex = `(<p>\\s*)?${tocMatch.toString().replace(/^\/|\/$/g, '')}(<br\\s*\\/?>)?(\\s*<\\/p>)?`;
    uc.innerHTML = uc.innerHTML.replace(new RegExp(regex, 'ms'), content);
  }
});
