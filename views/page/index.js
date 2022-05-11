import html from 'choo/html';
import raw from 'choo/html/raw';

import { pageDisplay } from './display';
import { pageEdit } from './edit';

export const pageView = (state, emit, page) => {
  const { edit, help, p, events } = state;
  const { cd, md } = page;

  if (edit) {
    return pageEdit(state, emit, page);
  }
  const breadcrumb = state.help.breadcrumb(page);
  
  const crFormat = help.formatDate(new Date(cd));
  const modified = new Date(md);
  const mdFormat = help.formatDate(modified);
  return [
    html`<header>
      ${breadcrumb.map(p => [html`<a href="${state.siteRoot}?page=${p.slug}">${p.name}</a>`, ' / '])}
      <div class="r ns">
        <h1 class=c>${page.name}</h1>
        <div class="c w14 tr">
          <time datetime=${modified.toISOString()}>
            ${
              crFormat !== mdFormat
              ? html`<abbr title="Created: ${crFormat}">${mdFormat}</abbr>`
              : mdFormat
            }
          </time>
        ${
          !p.published
          ? html`<button onclick=${() => emit(events.START_EDIT)}>Edit</button>
          `
          : ''
        }
        </div>
      </div>
    </header>`,
    pageDisplay(state, emit, page)
  ];
}