import html from 'choo/html';
import raw from 'choo/html/raw';
import { injectImageById, injectPageLink, injectTargetBlank } from '../../helpers/injection';

export const pageDisplay = (state, emit, page) => {
  const { siteRoot, help, p, events } = state;
  const { content } = page;
  let c = injectTargetBlank(content);
  c = injectPageLink(c, state);
  c = injectImageById(c, state);
  const children = help.getChildren(page);
  return [
    html`<article class=uc>
      ${ c ? raw(c) : 'No Page Content' }
    </article>`,
    children.length > 0 ? html`<aside>
      <h2>Sub Pages</h2>
      <ul>
        ${children.map(c => html`<li><a href="${siteRoot}?page=${c.slug}">${c.name}</a></li>`)}
      </ul>
    </aside>` : null,
    html`<footer>
      <div class=r>
        <dl class="c w34 r">
          <dt class=c><b>Tagged:</b></dt>
          <dd class=c>
            ${
              page?.tags
              ? page.tags.replace(/,/g, ', ')
              : ''
            }
          </dd>
        </dl>
        ${
          !p.published
          ? html`<div class="c w14 tr">
            <button onclick=${() => emit(events.START_EDIT)}>Edit</button>
          </div>`
          : ''
        }
      </div>
    </footer>`
  ];
}