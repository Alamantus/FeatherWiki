/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension adds Fuse.js from a CDN, creates a search results view, adds a search bar to the menu each render,
// and displays search results when you press enter within the search box. This can likely be expanded or improved,
// but it should at least get you started!
(function searchExtension () {
  if (!window.FW._loaded) return setTimeout(searchExtension, 1); // wait until FW is mounted
  const { state, emitter } = window.FW;
  console.log('running searchExtension');
  const fuseScript = document.createElement('script');
  document.body.appendChild(fuseScript);
  fuseScript.onload = () => {if (state.query.search) emitter.emit('search', state.query.search);}
  fuseScript.src = 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2';
  state.searchInput = '';
  state.results = [];
  state.views.r = resultsView;
  emitter.on('search', q => {
    state.searchInput = q;
    state.results = (new Fuse(state.p.pages, { keys: ['name', 'content'] })).search(q);
    emitter.emit(state.events.PUSHSTATE, state.root + '?page=r&search=' + encodeURIComponent(q));
  });
  [state.events.DOMCONTENTLOADED, state.events.RENDER].forEach(ev => {
    emitter.on(ev, () => {
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        renderSearchBar();
      }, 50);
    });
  });
  emitter.emit(state.events.DOMCONTENTLOADED);

  function renderSearchBar () {
    if (!!document.getElementById('searchBar')) return;
    const input = html`<input id=searchBar placeholder="Search Pages" onkeyup=${e => {
      if (e.key === 'Enter') emitter.emit('search', e.target.value);
    }} oninput=${e => state.searchInput = e.target.value} value=${state.searchInput} />`;
    const nav = document.querySelector('.sb nav');
    nav.parentNode.insertBefore(input, nav);
  }

  function resultsView (state, emit) {
    return [
      html`<header>
        <h1>Search Results</h1>
        ${ state.searchInput.length ? html`<h2>for "${state.searchInput}"</h2>` : '' }
      </header>`,
      ...(
        state.results.length
        ? state.results.map(r => {
          const { name, slug, content, tags, editor } = r.item;
          const contentHtml = (html`<div></div>`);
          contentHtml.innerHTML = FW.inject.pg(md && editor === 'md' ? md(content) : content, state);
          const textOnlyContent = contentHtml.innerText;
          return html`<article class="g ed">
            <h3><a href="?page=${slug}">${name} <span class=h>(${slug})</span></a></h3>
            <div class=uc>${textOnlyContent.substring(0, 200)}${textOnlyContent.length > 200 ? '...' : ''}</div>
            ${tags?.length
              ? html`<aside>
                <dl class="db r">
                  <dt class=c><b>Tagged:</b></dt>
                  <dd class=c>
                    ${tags.replace(/,/g, ', ')}
                  </dd>
                </dl>
              </aside>`
              : ''
            }
          </article>`;
        }) : [html`<p>No Results</p>`]
      ),
    ];
  }
})();
