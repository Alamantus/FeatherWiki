import raw from 'choo/html/raw';

export const pageDisplay = (state, emit, page) => {
  const { imageById, pageLink, targetBlank, headingIds } = FW.inject;
  const { root, help } = state;
  const { content } = page;
  let c = content;
  if (process.env.EDITOR !== 'html') {
    // Only include snarkdown in the build if the editor is not html
    c = page.editor === 'md' ? md(content) : content;
  }
  c = imageById(
    pageLink(
      headingIds(
        targetBlank(c)
      ),
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
        ${children.map(c => html`<li><a href="${root}?page=${c.slug}">${c.name}</a></li>`)}
      </ul>
    </footer>` : null,
  ];
}
