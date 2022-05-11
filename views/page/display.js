import html from 'choo/html';
import raw from 'choo/html/raw';
import { injectImageById, injectPageLink, injectTargetBlank } from '../../helpers/injection';

export const pageDisplay = (state, emit, page) => {
  const { siteRoot, help, p, events } = state;
  const { cd, md, content } = page;
  let c = injectTargetBlank(content);
  c = injectPageLink(c, state);
  c = injectImageById(c, state);
  const children = help.getChildren(page);
  const crFormat = help.formatDate(new Date(cd));
  const modified = new Date(md);
  const mdFormat = help.formatDate(modified);
  return [
    !page.e ? html`<aside>
      <div class=r>
        ${page?.tags?.length
          ? html`<dl class="c w34 r">
            <dt class=c><b>Tagged:</b></dt>
            <dd class=c>
              ${page.tags.replace(/,/g, ', ')}
            </dd>
          </dl>` : ''
        }
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
    </aside>` : '',
    html`<article class=uc>
      ${ c ? raw(c) : 'No Page Content' }
    </article>`,
    children.length > 0 ? html`<footer>
      <h2>Sub Pages</h2>
      <ul>
        ${children.map(c => html`<li><a href="${siteRoot}?page=${c.slug}">${c.name}</a></li>`)}
      </ul>
    </footer>` : null,
  ];
}
