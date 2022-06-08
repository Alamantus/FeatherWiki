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
