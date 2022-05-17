import html from 'choo/html';
import raw from 'choo/html/raw';
import { injectImageById, injectPageLink, injectTargetBlank } from '../../helpers/injection';

export const pageDisplay = (state, emit, page) => {
  const { siteRoot, help } = state;
  const { content } = page;
  let c = content;
  if (process.env.EDITOR !== 'html') {
    c = page.editor === 'md' ? require('snarkdown')(content) : content;
  }
  c = injectImageById(
    injectPageLink(
      injectTargetBlank(c),
      state
    ),
    state
  );
  const children = help.getChildren(page);
  return [
    !page?.e && page?.tags?.length
      ? html`<aside>
        <dl class="db r">
          <dt class=c><b>Tagged:</b></dt>
          <dd class=c>
            ${page.tags.replace(/,/g, ', ')}
          </dd>
        </dl>
      </aside>`
      : '',
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
