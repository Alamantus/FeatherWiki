/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
export const pageDisplay = (state, page) => {
  const { img, pg, out, hLink } = FW.inject;
  const { help } = state;
  let nowiki = [];
  let nIdx = 0; // nowiki index
  // Parse out content wrapped "nowiki" HTML tags - must be added in either HTML or Markdown view
  let c = (page.content ?? '').replace(/(<nowiki>.*<\/nowiki>)/gs, (m, content) => {
    nowiki[nIdx] = content;
    return `{nowiki-${nIdx++}}`;
  });
  c = FW.img.fix(c);
  c = page.editor === 'md' ? md(c) : c;
  c = img(
    pg(
      hLink(
        out(c)
      ),
      state
    ),
    state
  );
  for (let i = 0; i < nIdx; i++) {
    c = c.replace(`{nowiki-${i}}`, nowiki[i]);
  }
  const children = help.getChildren(page, true);
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
