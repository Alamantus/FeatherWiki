/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension adds Turndown.js from a CDN and overrides the toggle button behavior for switching between HTML and markdown editors.
(function htmlToMarkdownExtension () {
  if (!window.FW._loaded) return setTimeout(htmlToMarkdownExtension, 1); // wait until FW is mounted
  const { state, emitter } = window.FW;
  const turndownScript = document.createElement('script');
  turndownScript.src = 'https://unpkg.com/turndown@7.1.1/dist/turndown.js';
  document.body.appendChild(turndownScript);
  const interval = setInterval(() => {
    if (TurndownService) {
      // Wait until turndown is loaded and then make the escape process less aggressive
      TurndownService.prototype.escape = md => {
        return md.replace(/^(\d+)\./g, '$1\\.');
      }
      clearInterval(interval);
    }
  }, 500);
  [state.events.DOMCONTENTLOADED, state.events.RENDER].forEach(ev => {
    emitter.on(ev, () => {
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        convertHtmlToMarkdown();
      }, 50);
    });
  })
  emitter.emit(state.events.DOMCONTENTLOADED);

  function convertHtmlToMarkdown () {
    const ref = document.querySelector('form div.w1.tr');
    if (!ref) return;
    const button = ref.querySelector('button');
    if (!button) return;
    var newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    newButton.addEventListener('click', e => {
      e.preventDefault();
      const { useMd, content } = state.edits;
      if (useMd) {
        state.edits.content = md(content);
      } else {
        var turndownService = new TurndownService({
          headingStyle: 'atx',
          hr: '---',
          bulletListMarker: '-',
        });
        turndownService.keep(['del', 'ins']);
        state.edits.content = FW.img.abbr(turndownService.turndown(content));
      }
      state.edits.useMd = !useMd;
      emitter.emit(state.events.RENDER);
    });
  }
})();
