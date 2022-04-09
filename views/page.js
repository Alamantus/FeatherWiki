import html from 'choo/html';
import raw from 'choo/html/raw';

export const pageView = (state, emit, page) => {
  const { events } = state;
  return html`<section>
    <header>
      <h1>${page.name}</h1>
    </header>
    <article>
      ${
        page?.content
        ? raw(page.content)
        : ''
      }
    </article>
    <footer class=r>
      <div class="c w34">
        ${
          page?.tags
          ? page.tags.map(tag => html`<span>${tag}</span>`)
          : ''
        }
      </div>
      <div class="c w14 tr">
        <button type="submit">Edit</button>
      </div>
    </footer>
  </section>`;
}