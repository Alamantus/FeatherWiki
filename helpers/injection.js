import { slugify } from "./formatting";

export function injectPageLink (content, state) {
  let c = content ?? null;
  if (c) {
    (content?.match(/\[\[.+?(?=\]\])/g) ?? []).forEach(l => {
      const match = l.replace('[[', '').split('|');
      const slug = match[1] ? match[1].trim() : slugify(match[0]);
      const exists = state.p.pages.some(pg => pg.slug === slug);
      c = c.replace(
        `${l}]]`,
        `<a href="${state.root}?page=${slug}"${!exists ? ' class=e' : ''}>${match[0]}</a>`
      );
    });
  }
  return c;
}

export function injectImageById (content, state, includeId = false) {
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

export function truncateImages (content) {
  return content.replace(/(?:<img src=")[^"]+#([-\d]+)(?=")/g, '<img src="img:$1:img');
}

export function injectTargetBlank (content) {
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

export function injectHeadingIds (content) {
  let c = content ?? null;
  if (c) {
    (content?.match(/<h\d>.+?<\/h\d>/gi) ?? []).forEach(h => {
      const m = h.match(/<h(\d)>(.+)<\/h\d>/i); // Grab relevant capture groups from each match
      const slug = slugify(m[2]);
      c = c.replace(
        h,
        `<h${m[1]} id=${slug}>${m[2]} <a class=l href=#${slug}>#</a></h${m[1]}>`
      );
    });
  }
  return c;
}
