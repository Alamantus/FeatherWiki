import html from 'choo/html';

import { views } from './index';

export const globalView = (state, emit) => {
  const {
    siteRoot,
    pg,
    p,
    t,
    events,
    query,
    changedSinceSave,
    showSidebar,
    showNewPageField,
  } = state;

  const showEditFields = !p.published || query.page === 's';

  const parents = p.pages.filter(page => !page.parent).sort((a, b) => a.name < b.name ? -1 : 1);

  let pageToRender = pg
    ? views.p.render(state, emit, pg)
    : views[query.page ?? 'h']?.render(state, emit);
  if (query.tag) {
    pageToRender = views.t.render(state, emit);
  }
  
  return html`<body>
    <header class="r">
      <div class="c w12">
        <p><a href=${siteRoot} class="t sb">${p.name}</a></p>
        ${ p.desc ? html`<p class=sb>${p.desc}</p>` : ''}
        <button class=sbt onclick=${() => toggleSidebar()}>${showSidebar ? 'Hide' : 'Show'} Menu</button>
      </div>
      ${
        showEditFields
        ? html`<div class="c w12 tr">
          ${changedSinceSave ? 'Wiki has changed!' : ''} <button class=${changedSinceSave ? 'alert' : null} title="Download wiki in its current state" onclick=${() => emit(events.SAVE_WIKI)}>Save Wiki</button>
        </div>`
        : ''
      }
    </header>
    <main>
      <nav class="sb" hidden=${!showSidebar}>
        <ul>
        ${
          showEditFields
          ? [
            html`<li><a href="${siteRoot}?page=s">${views.s.name}</a></li>`,
            html`<li>
              <button onclick=${() => emit(events.SHOW_NEW_PAGE_FIELD)}>New Page</button>
              <form hidden=${!showNewPageField} onsubmit=${createNewPage}>
                <label class="sr" for="newPageField">New Page Title</label>
                <input id="newPageField" placeholder="New Page Title" autocomplete="off">
                <button type="submit">Create</button>
              </form>
            </li>`
          ] : ''
        }
        ${parents.map(page => html`<li><a href="${siteRoot}?page=${page.slug}">${page.name}</a></li>`)}
        ${
          t.length > 0
          ? html`<li>
            <b>Tags</b>
            <ul>
              ${ t.map(tag => html`<li><a href="${siteRoot}?tag=${tag}">${tag}</a></li>`)}
            </ul>
          </li>`
          : ''
        }
        </ul>
      </nav>
      ${ pageToRender }
    </main>
    <footer>
      <span class="fr">Powered by <a href="{{package.json:homepage}}" target="_blank" rel="noopener noreferrer">{{package.json:title}}</a></span>
    </footer>
  </body>`;

  function createNewPage(e) {
    e.preventDefault();
    const title = e.currentTarget.newPageField.value.trim();
    if (title.length < 2) return alert('Enter more than 1 character to create a new page.');
    emit(events.CREATE_PAGE, title.trim());
  }

  function toggleSidebar() {
    state.showSidebar = !state.showSidebar;
    emit(events.RENDER);
  }
};
