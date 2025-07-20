/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// Ez a bővítmény egy keresőmezőt ad hozzá egy nagyon egyszerű szöveges kereséssel, amelynek eredményei a mezőből felugranak, ha van találat.
FW.ready(() => {
  const { state, emitter } = FW;
  console.log('a feather-search.js futtatása');
  state.searchDebounce = null;
  ['DOMContentLoaded', 'render'].forEach(ev => {
    emitter.on(ev, () => {
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        renderSearchBar();
      }, 50);
    });
  });
  emitter.emit('DOMContentLoaded');

  function renderSearchBar () {
    if (!!document.getElementById('featherSearch')) return;
    const input = html`<div id=featherSearch>
      <input id=featherSearchBar type=search placeholder="Oldalak Keresése" onsearch=${e => search(e)} oninput=${e => search(e)} onblur=${() => {
        setTimeout(() => document.getElementById('featherSearchResults').style.display = 'none', 300);
      }} onfocus=${() => {
        if (document.getElementById('featherSearchResults').innerHTML.length > 0) document.getElementById('featherSearchResults').style.display = null;
      }} />
      <div id=featherSearchResults style="display:none;"></div>
      <style>
        #featherSearch{position:relative;}
        #featherSearchResults{
          position: absolute;
          background: #fff;
          border: 1px solid #000;
          top: calc(12pt + .5rem + 2px);
          left: 0;
          width: 100%;
          max-height: 300px;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 3px;
          border-radius: 3px;
          z-index: 10;
        }
        #featherSearchResults a{
          display: block;
          box-sizing: border-box;
          width: 100%;
          padding: 6px 10px;
          margin: 2px 0;
          color: #000;
        }
        #featherSearchResults a:hover{color:#fff;background:#65a;}
      </style>
    </div>`;
    const nav = document.querySelector('.sb nav');
    nav.parentNode.insertBefore(input, nav);
  }

  function search (e) {
    if (state.searchDebounce !== null) clearTimeout(state.searchDebounce);
    state.searchDebounce = setTimeout(() => {
      const val = e.target.value.trim().toLowerCase();
      const resultsContainer = document.getElementById('featherSearchResults');
      resultsContainer.innerHTML = '';
      if (val.length < 2) return resultsContainer.style.display = 'none';
      const index = state.p.pages.map(p => {
        const { id, name, slug, content, editor } = p;
        let textContent = '';
        if (content) {
          const contentHtml = (html`<div></div>`);
          contentHtml.innerHTML = FW.inject.pg((typeof md !== 'undefined' && editor === 'md') ? md(content) : content, state);
          textContent = contentHtml.textContent.trim();
        }
        return { id, name, searchName: name.toLowerCase(), slug, content: textContent, searchContent: textContent.toLowerCase() };
      });
      const matches = [];
      [
        ...index.filter(p => p.searchName.startsWith(val)),
        ...index.filter(p => p.searchContent.startsWith(val)),
        ...index.filter(p => p.searchName.endsWith(val)),
        ...index.filter(p => p.searchContent.endsWith(val)),
        ...index.filter(p => p.searchName.includes(val)),
        ...index.filter(p => p.searchContent.includes(val)),
      ].forEach(p => {
        if (!matches.find(m => m.id === p.id)) matches.push(p);
      });
      const markMatch = m => {
        const start = m.toLowerCase().indexOf(val);
        if (start < 0) return m;
        const end = start + val.length;
        return m.substring(0, start) + '<mark>' + m.substring(start, end) + '</mark>' + m.substring(end);
      };
      resultsContainer.innerHTML = matches.map(p => {
        let contentSnippet = '';
        let contentStart = p.searchContent.indexOf(val);
        if (contentStart >= 0) {
          const pad = 20;
          let contentEnd = contentStart + val.length + pad;
          if (contentEnd > p.searchContent.length) contentEnd = p.searchContent.length;
          contentStart -= pad;
          if (contentStart < 0) contentStart = 0;
          contentSnippet = p.content.substring(contentStart, contentEnd);
          if (contentStart > 0) contentSnippet = '...' + contentSnippet;
          if (contentEnd < p.searchContent.length) contentSnippet += '...';
        }
        return `<a href="?page=${p.slug}">${markMatch(p.name)}${contentSnippet.length > 0 ? '<div class=h>' + markMatch(contentSnippet) + '</div>' : ''}</a>`;
      }).join('');
      resultsContainer.style.display = null;
    }, 500);
  }
});
