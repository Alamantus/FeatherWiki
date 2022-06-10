export const pagesView = (state, emit) => {
  const { p, help } = state;
  return [
    html`<header>
      <h1>All Pages</h1>
    </header>`,
    html`<article>
      <p>This wiki has ${p.pages.length} page${p.pages.length !== 1 ? 's' : ''}:</p>
      <ul>
        ${
          p.pages.filter(pg => !pg.parent)
            .map(page => help.getChildList(page))
        }
      </ul>
    </article>`
  ];
}