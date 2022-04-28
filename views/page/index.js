import html from 'choo/html';
import raw from 'choo/html/raw';

import { pageDisplay } from './display';
import { pageEdit } from './edit';

export const pageView = (state, emit, page) => {
  if (state.edit) {
    return pageEdit(state, emit, page);
  }
  const breadcrumb = state.help.breadcrumb(page);
  return html`<section>
    <header>
      ${breadcrumb.map(p => [html`<a href="${state.siteRoot}?page=${p.slug}">${p.name}</a>`, ' / '])}
      <h1>${page.name}</h1>
    </header>
    ${ pageDisplay(state, emit, page) }
  </section>`;
}