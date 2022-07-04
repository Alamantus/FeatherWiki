/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// Generate full html doc for saving. See also index.html
export function generateWikiHtml(state) {
  const { c, p, j, views } = state;
  const content = (p.static ? staticHtml() : views.a(state)[1]).outerHTML;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${p.name}</title>
  ${p.desc ? `<meta name="description" content="${p.desc.replace(/"/g, '\\"')}">` : ''}
  <meta name="version" content="{{buildVersion}}_{{package.json:version}}" />
  <meta name="application-name" content="{{package.json: title}}" />
  <style id="s">${document.getElementById('s').innerHTML}</style>
  ${c ? `<style id=c>${c}</style>` : ''}
  <script id="p" type="application/json">${JSON.stringify(FW.json.compress(p))}</script>
  <script id="a">${document.getElementById('a').innerHTML}</script>
</head>
<body>
  <header>
  <h1>${p.name}</h1>
  ${ p.desc ? `<p>${p.desc}</p>` : ''}
  </header>
  <main>${content}</main>
  <footer><a href="https://src.feather.wiki/#versions">JavaScript required to edit</a></footer>
  ${j ? `<script id=j>${j}</script>` : ''}
</body>
</html>`;
}

export function staticHtml() {
  const { state } = FW;
  const { pages } = state.p;
  const { img, out } = FW.inject;
  return html`<div>
  ${pages.map(pg => {
    let c = pg.content;
    if (process.env.EDITOR !== 'html') {
      c = pg.editor === 'md' ? md(c) : c;
    }
    c = img(pgAnchor(out(c)), state);
    return html`<article>
      <h1 id=${pg.slug}>${pg.name}</h1>
      <section>${html.raw(c)}</section>
    </article>`
  })}
  </div>`;

  function pgAnchor (c) {
    (c?.match(/\[\[.+?(?=\]\])/g) ?? []).forEach(l => {
      const match = l.replace('[[', '').split('|');
      const slug = match[1] ? match[1].trim() : FW.slug(match[0]);
      c = c.replace(
        `${l}]]`,
        `<a href="#${slug}">${match[0]}</a>`
      );
    });
    return c;
  }
}
