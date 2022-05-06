import html from 'choo/html';

export const homeView = (state, emit) => {
  const { p, help } = state;
  return html`<section>
    <header>
      <h1>Welcome</h1>
    </header>
    <article>
      <p>This wiki has ${p.pages.length} page${p.pages.length !== 1 ? 's' : ''}:</p>
      <ul>
        ${
          p.pages.filter(pg => !pg.parent)
            .map(page => getChildrenList(page))
        }
      </ul>
    </article>
  </section>`;

  function getChildrenList(page) {
    const children = help.getChildren(page);
    return html`<li>
      <a href="?page=${page.slug}">${page.name}</a>
      ${
        children.length > 0
        ? html`<ul>${children.map(pg => getChildrenList(pg))}</ul>`
        : ''
      }
    </li>`;
  }
}