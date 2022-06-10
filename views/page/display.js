export const pageDisplay = (state, emit, page) => {
  const { img, pg, out, hLink } = FW.inject;
  const { root, help } = state;
  let c = page.content;
  if (process.env.EDITOR !== 'html') {
    c = page.editor === 'md' ? md(c) : c;
  }
  c = img(
    pg(
      hLink(
        out(c)
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
      ${ c ? html.raw(c) : 'No Page Content' }
    </article>`,
    children.length > 0 ? html`<footer>
      <h2>Sub Pages</h2>
      <ul>
        ${children.map(c => help.getChildList(c, true))}
      </ul>
    </footer>` : null,
  ];
}
