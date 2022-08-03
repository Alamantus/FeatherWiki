/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
import { pageDisplay } from './display';
import { pageEdit } from './edit';

export const pageView = (state, emit, page) => {
  const { root, edit, help, p, events } = state;
  const { cd, md } = page; // created date & modified date

  if (edit) {
    return pageEdit(state, emit, page);
  }
  const breadcrumb = help.breadcrumb(page);
  
  const crFormat = FW.date(new Date(cd));
  const modified = new Date(md ?? cd); // If no modified date, use created
  const mdFormat = FW.date(modified);
  return [
    html`<header>
      ${breadcrumb.map(p => [html`<a href="${root}?page=${p.slug}">${p.name}</a>`, ' / '])}
      <div class="r ns">
        <h1 class=c>${page.name}</h1>
        ${
          page.e
          ? ''
          : html`<div class="c w14 tr">
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
          </div>`
        }
      </div>
    </header>`,
    pageDisplay(state, page)
  ];
}