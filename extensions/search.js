// This extension adds Fuse.js from a CDN, creates a search results view, adds a search bar to the menu each render,
// and displays search results when you press enter within the search box. This can likely be expanded or improved,
// but it should at least get you started!
if (!window.FW._loaded) window.FW.use(searchExtension);
else (({state, emitter}) => searchExtension(state, emitter))(window.FW);

function searchExtension (state, emitter) {
  const fuseScript = document.createElement('script');
  fuseScript.src = 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2';
  document.body.appendChild(fuseScript);
  state.searchInput = '';
  state.results = [];
  state.views.r = resultsView;
  emitter.on('search', q => {
    state.searchInput = q;
    state.results = (new Fuse(state.p.pages, { keys: ['name', 'content'] })).search(q);
    emitter.emit(state.events.PUSHSTATE, state.root + '?page=r');
  });
  [state.events.DOMCONTENTLOADED, state.events.RENDER].forEach(ev => {
    emitter.on(ev, () => {
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        renderSearchBar();
      }, 50);
    });
  })
  if (window.FW._loaded) emitter.emit(state.events.DOMCONTENTLOADED);

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
          const { name, slug, content, tags } = r.item;
          return html`<article class="g ed">
            <h3><a href="?page=${slug}">${name} <span class=h>(${slug})</span></a></h3>
            <div class=uc>${content.substring(0, 200)}${content.length > 200 ? '...' : ''}</div>
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
}
