import { compress } from 'json-compress';

// Generate full html doc for saving. See also index.html
export function generateWikiHtml(state) {
  const { a, s, c, p } = state;
  return `<!DOCTYPE html>
<html lang=en>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${p.name}</title>
  ${p.desc ? '<meta name="description" content="' + p.desc.replace(/"/g, '\\"') + '">' : ''}
  <meta name="version" content="{{package.json:version}}" />
  <style id="s">${s}</style>
  ${c ? `<style id=c>${c}</style>` : ''}
</head>
<body>
  <a href="https://codeberg.org/Alamantus/FeatherWiki#supported-browsers">JavaScript</a> is required
  <script id="p" type="application/json">${JSON.stringify(compress(p))}</script>
  <script id="a">${a}</script>
</body>
</html>`;
}
