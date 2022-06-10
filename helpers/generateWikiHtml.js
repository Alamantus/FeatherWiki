// Generate full html doc for saving. See also index.html
export function generateWikiHtml(state) {
  const { a, s, c, p, j, views } = state;
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
  <style id="s">${s}</style>
  ${c ? `<style id=c>${c}</style>` : ''}
  <script id="p" type="application/json">${JSON.stringify(FW.json.compress(p))}</script>
  <script id="a">${a}</script>
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
