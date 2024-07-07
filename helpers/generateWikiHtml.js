/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */

import { globalView } from "../views/global";

// Generate full html doc for saving. See also index.html
export default function (state) {
  const { c, p, j } = state;
  return `<!DOCTYPE html>
<html lang="{{localeName}}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${p.name}</title>
  ${p.desc ? `<meta name="description" content="${p.desc.replace(/"/g, '\\"')}">` : ''}
  <meta name="application-name" content="{{package.json:title}}" />
  <meta name="version" content="{{package.json:version}}" />
  <style id="s">${document.getElementById('s').innerHTML}</style>
  ${c ? `<style id=c>${c}</style>` : ''}
  <script id="p" type="application/json">${JSON.stringify(FW.json.compress(p))}</script>
  <script id="a">${document.getElementById('a').innerHTML}</script>
  ${FW.inject.esc(p.head, true)}
</head>
<body>
  ${staticExport()}
  <footer>{{translate:javascriptRequired}}</footer>
  ${j ? `<script id=j>FW.ready(()=>{/**/${j}/**/});</script>` : ''}
</body>
</html>`;

  function staticExport() {
    const st = { ...state, edit: false, sb: true, sbx: new Set(), pg: undefined, query: { page: 'a' }, p: { ...p, published: true } };
    const doc = globalView(st);
    doc.querySelector('.sb .tabs').remove();
    if (p.static) {
      // If "Include Static HTML" is checked, adjust URLs
      const page = doc.querySelector('main>section');
      page.parentElement.replaceChild(allPagesHtml(st), page);
      // Remove "All Pages" link & mobile toggle menu button
      doc.querySelector('.sb>nav>ul>li:last-child,.sbt').remove();
    }
    doc.querySelectorAll('a').forEach(a => {
      a.classList.remove('a')
      a.href = a.href.includes('#') ? a.href.replace(/.+(#.+)$/, '$1') : (
        a.href.includes(`page=`)
          ? a.href.replace(/.+(page=.+)(\&.+)*?$/, p.static ? '#$1' : '?$1')
          : a.href.replace(location.toString().split('?')[0], '') // Ensure local path is not included
      );
    });
    return doc.querySelector('main').outerHTML;
  }

  function allPagesHtml(st) {
    return html`<section>
      ${p.pages.map(pg => {
        const pv = state.views.p(st, '', pg);
        pv[0].querySelector('h1').id = 'page=' + pg.slug;
        return html`<article>
          ${pv[0]}
          <div class=uc>${ html.raw(pv[1][1].innerHTML) }</div>
        </article>`;
      })}
    </section>`;
  }
}
