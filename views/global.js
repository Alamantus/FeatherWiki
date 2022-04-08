import html from 'choo/html';
import raw from 'choo/html/raw';

export const globalView = (state, emit) => {
  const { siteRoot, p, events, changedSinceSave, showSidebar, showNewPageField } = state;
  const pageSlug = state.query.page;
  const page = p.pages.find(p => p.slug === pageSlug);
  let pageTitle;
  switch (pageSlug) {
    case 'settings': pageTitle = 'Wiki Settings'; break;
    default: pageTitle = page?.title ?? 'Welcome'; break;
  }
  
  return html`<body>
    <header>
      <a href=${siteRoot} class="title">${p.title}</a>
      <span class="fr">${changedSinceSave ? 'Wiki has changed!' : ''} <button class=${changedSinceSave ? 'alert' : null} title="Download wiki in its current state" onclick=${() => emit(events.SAVE_WIKI)}>Save</button></span>
    </header>
    <main>
      <nav class="sb" hidden=${!showSidebar}>
        <ul>
          <li><a href="${siteRoot}?page=settings">Wiki Settings</a></li>
          <li>
            <button onclick=${() => emit(events.SHOW_NEW_PAGE_FIELD)}>New Page</button>
            <form hidden=${!showNewPageField} onsubmit=${createNewPage}>
              <label class="sr" for="newPageField">New Page Title</label>
              <input id="newPageField" placeholder="New Page Title" autocomplete="off">
              <button type="submit">Create</button>
            </form>
          </li>
        </ul>
      </nav>
      <section>
        <header>
          <h1>${pageTitle}</h1>
        </header>
      </section>
    </main>
    <footer>
      <span class="fr">Powered by <a href="https://codeberg.org/Alamantus/FeatherWiki" target="_blank" rel="noopener noreferrer">FeatherWiki</a></span>
    </footer>
  </body>`;

  function createNewPage(e) {
    e.preventDefault();
    const title = e.currentTarget.newPageField.value;
    emit(events.CREATE_NEW_PAGE, title.trim());
  }
};
