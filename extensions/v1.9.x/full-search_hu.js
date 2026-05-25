/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// Ez a bővítmény hozzáadja a Fuse.js-t egy CDN-ből, létrehoz egy keresési eredmény nézetet, és minden rendereléskor hozzáad egy keresősávot a menühöz,
// és megjeleníti a keresési eredményeket, amikor a keresőmezőben megnyomja az Entert. Ez valószínűleg bővíthető vagy javítható,
// de kezdetnek nem rossz!
FW.ready(() => {
  const { state, emitter } = FW;
  console.log('a full-search.js futtatása');
  const fuseScript = document.createElement('script');
  document.body.appendChild(fuseScript);
  fuseScript.onload = () => {if (state.query.search) emitter.emit('search', state.query.search);}
  fuseScript.src = 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2';
  state.searchInput = '';
  state.results = [];
  state.views.r = resultsView;
  emitter.on('search', q => {
    state.searchInput = q;
    state.results = (new Fuse(state.p.pages, {
      shouldSort: true,
      threshold: 0.4,
      ignoreLocation: true,
      keys: ['name', 'content'],
    })).search(q);
    emitter.emit(state.events.GO, state.root + '?page=r&search=' + encodeURIComponent(q));
  });
  ['DOMContentLoaded', 'render'].forEach(ev => {
    emitter.on(ev, () => {
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        renderSearchBar();
      }, 50);
    });
  });
  emitter.emit('DOMContentLoaded');

  function renderSearchBar () {
    if (!!document.getElementById('searchBar')) return;
    const input = html`<input id=searchBar placeholder="Oldalak Keresése" onkeyup=${e => {
      if (e.key === 'Enter') emitter.emit('search', e.target.value);
    }} oninput=${e => state.searchInput = e.target.value} value=${state.searchInput} />`;
    const nav = document.querySelector('.sb nav');
    nav.parentNode.insertBefore(input, nav);
  }

  function resultsView (state, emit) {
    return [
      html`<header>
        <h1>Keresési Eredmények</h1>
        ${ state.searchInput.length ? html`<h2>Kifejezés: "${state.searchInput}"</h2>` : '' }
      </header>`,
      ...(
        state.results.length
        ? state.results.map(r => {
          const { name, slug, content, tags, editor } = r.item;
          let textContent = '';
          if (content) {
            const contentHtml = (html`<div></div>`);
            contentHtml.innerHTML = FW.inject.pg((typeof md !== 'undefined' && editor === 'md') ? md(content) : content, state);
            textContent = contentHtml.textContent.trim();
          }
          return html`<article class="g ed">
            <h3><a href="?page=${slug}">${name} <span class=h>(${slug})</span></a></h3>
            <div class=uc>${textContent.substring(0, 200)}${textContent.length > 200 ? '...' : ''}</div>
            ${tags?.length
              ? html`<aside>
                <dl class="db r">
                  <dt class=c><b>Címkék:</b></dt>
                  <dd class=c>
                    ${tags.replace(/,/g, ', ')}
                  </dd>
                </dl>
              </aside>`
              : ''
            }
          </article>`;
        }) : [html`<p>Nincs Találat</p>`]
      ),
    ];
  }
});
