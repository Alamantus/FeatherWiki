/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension uses [Autolinker](https://github.com/gregjacobs/Autolinker.js) to automatically turn text URLs into hyperlinks. It was originally written by [Leo Chen](https://github.com/lchen198) and adapted into an official extension by request: https://codeberg.org/Alamantus/FeatherWiki/issues/168
(() => {
  const autoLinkerScript = document.createElement('script');
  document.body.appendChild(autoLinkerScript);
  autoLinkerScript.onload = () => FW.ready(() => {
    const { emitter } = FW; // Extract state &amp; emitter for easier use
    ['DOMContentLoaded', 'render'].forEach(ev => {
      emitter.on(ev, () => {
        setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
          AutoLinkExtension();
        }, 100);
      });
    });
    emitter.emit('DOMContentLoaded'); // Ensure your extension renders

    function AutoLinkExtension() {
      // Select the article with class "uc"
      const article = document.querySelector('article.uc');

      if (article) {
        // Use Autolinker to replace paths in the page content
        const linkedContent = Autolinker.link(article.innerHTML);
        // Set the linked content back to the article
        article.innerHTML = linkedContent;
      }
    }
  });
  autoLinkerScript.src = 'https://cdn.jsdelivr.net/npm/autolinker@4.0.0/dist/autolinker.min.js';
})();
