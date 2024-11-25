/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension finds any content between double braces {{like_this}} and looks for a page with a matching
// slug. If found, the braced content will be replaced with the content of the target page within an `article`
// tag with a class of `transclusion` so it can be targeted and styled.
// Add `|raw` {{like_this|raw}} to exclude the heading and link to the transcluded page & only show content.
FW.ready(() => {
  const { state, emitter } = FW;
  state.tDepth = 0;
  state.tDepthMax = 20; // Maximum depth to check for transclusion
  ['DOMContentLoaded', 'render'].forEach(ev => {
    emitter.on(ev, () => {
      state.tDepth = 0;
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        injectTransclusion();
      }, 300);
    });
  });
  emitter.emit('DOMContentLoaded');

  function injectTransclusion() {
    if (state.pg) {
      const uc = document.querySelector('.uc');
      const matches = uc?.innerHTML?.match(/{{[^}]+}}/g) ?? [];
      matches.forEach(l => {
        let includeHeading = true;
        let slug = l.replace(/[}{]/g, '').trim();
        if (/\|\s?raw/.test(slug)) {
          includeHeading = false;
          slug = slug.replace(/\|\s?raw/, '').trim();
        }
        const page = state.p.pages.find(pg => pg.slug === slug);
        if (!page) return;
        const parsed = parseContent(page.content, page.editor === 'md');
        const pageContent = includeHeading
          ? `<h1 id=${page.slug}>${page.name} <a internal href="?page=${page.slug}" class="fr h">Go to Page</a></h1>${parsed}`
          : parsed;
        uc.innerHTML = uc.innerHTML.replace(
          l,
          `<article class="transclusion">${pageContent}</article>`
        );
      });
      if (matches.length > 0 && state.tDepth < state.tDepthMax) {
        state.tDepth++;
        // If transclusion is injected, run again to see if more is needed
        // Only run it state.tDepthMax times to prevent potential infinite recursion
        injectTransclusion();
      }
    }
  }

  function parseContent(pageContent, isMd = false) {
    if (typeof FW.parseContent !== 'undefined') {
      return FW.parseContent(pageContent, isMd);
    }

    const { img, pg, out, hLink } = FW.inject;
    let nowiki = [];
    let nIdx = 0; // nowiki index
    // Parse out content wrapped "nowiki" HTML tags - must be added in either HTML or Markdown view
    let c = (pageContent ?? '').replace(/(<nowiki>.*<\/nowiki>)/gs, (m, content) => {
      nowiki[nIdx] = content;
      return `{nowiki-${nIdx++}}`;
    });
    c = pg(FW.img.fix(c));
    c = isMd ? md(c ?? '') : c;
    c = img(
      hLink(
        out(c)
      )
    );
    for (let i = 0; i < nIdx; i++) {
      c = c.replace(`{nowiki-${i}}`, nowiki[i]);
    }
    return c;
  }
});
