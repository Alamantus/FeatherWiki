import html from 'choo/html';
import raw from 'choo/html/raw';

export const pageDisplay = (state, emit, page) => {
  const { content } = page;
  let c = content ?? null;
  if (c) {
    (content ? content.match(/(\[\[.+\]\])?/g) : []).map(l => {
      const name = l.replace('[[', '').replace(']]', '');
      return {
        match: l,
        link: `<a href="${state.siteRoot}?page=${state.help.slugify(name)}">${name}</a>`,
      };
    }).forEach(l => {
      c = c.replace(l.match, l.link);
    });
  }
  return [
    html`<article>
      ${ c ? raw(c) : 'No Page Content' }
    </article>`,
    html`<footer class=r>
      <div class="c w34">
        ${
          page?.tags
          ? page.tags.join(', ')
          : ''
        }
      </div>
      ${
        page.id
        ? html`<div class="c w14 tr">
          <button onclick=${() => emit(state.events.START_EDIT)}>Edit</button>
        </div>`
        : ''
      }
    </footer>`
  ];
}