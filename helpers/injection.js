export function injectPageLink (content, state) {
  let c = content ?? null;
  if (c) {
    (content?.match(/\[\[.+?(?=\]\])/g) ?? []).map(l => {
      const match = l.replace('[[', '').split('|');
      const slug = match[1] ? match[1].trim() : state.help.slugify(match[0]);
      const exists = state.p.pages.some(pg => pg.slug === slug);
      return {
        match: `${l}]]`,
        link: `<a href="${state.siteRoot}?page=${slug}"${!exists ? ' class=e' : ''}>${match[0]}</a>`,
      };
    }).forEach(l => {
      c = c.replace(l.match, l.link);
    });
  }
  return c;
}

export function injectImageById (content, state, includeId = false) {
  let c = content ?? null;
  if (c) {
    (content?.match(/img:.+?(?=:img)/g) ?? []).map(id => {
      id = id.replace('img:', '');
      const img = state.p.img[id];
      return {
        match: `img:${id}:img`,
        link: img + (includeId ? `#${id}` : ''),
      };
    }).forEach(l => {
      c = c.replace(l.match, l.link);
    });
  }
  return c;
}

export function injectTargetBlank (content) {
  let c = content ?? null;
  if (c) {
    (content?.match(/<a href=".+?(?=")/g) ?? []).map(url => {
      return {
        match: `${url}"`,
        link: `${url}" target="_blank" rel="noopener noreferrer"`,
      };
    }).forEach(l => {
      c = c.replace(l.match, l.link);
    });
  }
  return c;
}
