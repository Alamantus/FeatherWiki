import html from 'choo/html';

export const taggedView = (state, emit) => {
  const { p, query } = state;
  const pages = p.pages.filter(pg => pg.tags?.includes(query.tag));
  return html`<section>
    <header>
      <h1>Pages Tagged <code>${ query.tag }</code></h1>
    </header>
    <article>
      ${
        pages.length > 0
        ? html`<ul>
          ${ pages.map(pg => html`<li><a href="?page=${pg.slug}">${pg.name}</a></li>`) }
        </ul>`
        : 'None Found'
      }
    </article>
  </section>`;
}