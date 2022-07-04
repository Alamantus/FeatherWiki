/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// Replace [[page links]] with internal `a` tag links
export function pg (content, state) {
  let c = content ?? null;
  if (c) {
    (content?.match(/\[\[.+?(?=\]\])/g) ?? []).forEach(l => {
      const match = l.replace('[[', '').split('|');
      const slug = match[1] ? match[1].trim() : FW.slug(match[0]);
      const exists = state.p.pages.some(pg => pg.slug === slug);
      c = c.replace(
        `${l}]]`,
        `<a href="${state.root}?page=${slug}"${!exists ? ' class=e' : ''}>${match[0]}</a>`
      );
    });
  }
  return c;
}

// Replace truncated img:imageids:img with filled `img` tags
export function img (content, state, includeId = false) {
  let c = content ?? null;
  if (c) {
    (content?.match(/img:.+?(?=:img)/g) ?? []).forEach(idMatch => {
      id = idMatch.replace('img:', '');
      const i = state.p.img[id];
      c = c.replace(
        `${idMatch}:img`,
        i.img + (includeId ? `#${id}` : '') + `" alt="${i.alt}`
      );
    });
  }
  return c;
}

// Insert `target="_blank" rel="noopener noreferrer"` into every `a` tag to make it external
export function out (content) {
  let c = content ?? null;
  if (c) {
    (content?.match(/<a href=".+?(?=")/gi) ?? []).forEach(url => {
      // `url` contains something like `<a href="some/url`, leaving a dangling quote, so replacement doesn't need last quote
      c = c.replace(
        url,
        `${url}" target="_blank" rel="noopener noreferrer`
      );
    });
  }
  return c;
}

// Add an anchor link to each heading tag (h1–h6) inside user content (.uc)
export function hLink (content) {
  let c = content ?? null;
  if (c) {
    (content?.match(/<h\d>.+?<\/h\d>/gi) ?? []).forEach(h => {
      const m = h.match(/<h(\d)>(.+)<\/h\d>/i); // Grab relevant capture groups from each match
      const slug = FW.slug(m[2]);
      c = c.replace(
        h,
        `<h${m[1]} id=${slug}>${m[2]} <a class=l href=#${slug}>#</a></h${m[1]}>`
      );
    });
  }
  return c;
}
