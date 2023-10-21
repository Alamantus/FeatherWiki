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
      const text = !match[1] ? match[0].split('#')[0] : match[0]; // allow hash character in text when slug is used
      const link = (match[1] ?? match[0]).trim().split('#');
      if (!match[1]) link[0] = FW.slug(link[0]);
      // Find a page with the slug or view with the slug name
      const exists = state.p.pages.some(pg => pg.slug === link[0]) || typeof state.views[link[0]] !== 'undefined';
      c = c.replace(
        `${l}]]`,
        `<a internal href="?page=${link.join('#')}"${!exists ? ' class=e' : ''}>${text}</a>`
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
      if (typeof i !== 'undefined') {
        c = c.replace(
          `${idMatch}:img`,
          i.img + (includeId ? `#${id}` : '') + `" alt="${i.alt}`
        );
      }
    });
  }
  return c;
}

// Insert `target="_blank" rel="noopener noreferrer"` into every `a` tag to make it external
export function out (content) {
  let c = content ?? null;
  if (c) {
    (content?.match(/<a href="[^"]+">/gi) ?? []).forEach(url => {
      c = c.replace(
        url,
        url.replace('>', 'target="_blank" rel="noopener noreferrer">')
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

export function esc(string, unescape = false) {
  return (unescape
    ? string?.replace(/&[lg]t;/g, x => ({ '&lt;': '<', '&gt;': '>' }[x] ?? x))
    : string?.replace(/[<>]/g, x => ({ '<': '&lt;', '>': '&gt;' }[x] ?? x))
  ) ?? '';
}
