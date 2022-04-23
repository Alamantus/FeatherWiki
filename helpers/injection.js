export function injectPageLink (content, state) {
  let c = content ?? null;
  if (c) {
    (content?.match(/(?<=\[\[).+?(?=\]\])/g) ?? []).map(l => {
      const match = l.split('|');
      const slug = match[1] ? match[1].trim() : state.help.slugify(match[0]);
      return {
        match: `[[${l}]]`,
        link: `<a href="${state.siteRoot}?page=${slug}">${match[0]}</a>`,
      };
    }).forEach(l => {
      c = c.replace(l.match, l.link);
    });
  }
  return c;
}

export function injectImageById (content, state) {
  let c = content ?? null;
  if (c) {
    (content?.match(/(?<=img:).+?(?=:img)/g) ?? []).map(id => {
      const img = state.p.img[id];
      return {
        match: `img:${id}:img`,
        link: img,
      };
    }).forEach(l => {
      c = c.replace(l.match, l.link);
    });
  }
  return c;
}
