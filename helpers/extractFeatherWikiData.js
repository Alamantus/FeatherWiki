import { decompress } from 'json-compress';

export function extractFeatherWikiData(file, callback = () => {}) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const p = '<script id=p type=application/json>'; // Start of regular expression
    const pm = e.target.result.match(new RegExp(p + '.+?(?=</script>)', 'gs'));
    if ((pm ?? []).length < 1) return alert('Could not find {{package.json:title}} data.');
    let pd;
    pm.forEach(m => {
      m = m.replace(p, '');
      if (m[0] !== '{') return;
      pd = decompress(JSON.parse(m));
    });
    const c = '<style id=c>'; // Start of regular expression
    const cm = e.target.result.match(new RegExp(c + '.+?(?=</style>)', 'gs'));
    let cd = '';
    if ((cm ?? []).length > 0) cd = cm[0].replace(c, '');
    callback([pd, cd]);
  };
  reader.onerror = function (e) {
    console.error(e);
    callback(null);
  };
  reader.readAsText(file);
}
