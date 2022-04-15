import html from 'choo/html';

export const homeView = (state, emit) => {
  const { events, p } = state;
  return html`<section>
    <header>
      <h1>Welcome</h1>
    </header>
    <article>
      <p>This wiki has ${p.pages.length} page${p.pages.length !== 1 ? 's' : ''}:</p>
      <ul>
        ${p.pages.map(page => html`<li><a href="?page=${page.slug}">${page.name}</a></li>`)}
      </ul>
    </article>
  </section>`;
}