import { decompress } from 'json-compress';

export function extractFeatherWikiData(file, callback = () => {}) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const s = '<script id=p type=application/json>'; // Start of regular expression
    const matches = e.target.result.match(new RegExp(s + '.+?(?=</script>)', 'g'));
    if ((matches ?? []).length < 1) return alert('Could not find importable {{package.json:title}} data.');
    matches.forEach(m => {
      m = m.replace(s, '');
      console.log(m);
      if (m[0] !== '{') return;
      callback(decompress(JSON.parse(m)));
    });
  };
  reader.onerror = function (e) {
    console.error(e);
    callback(null);
  };
  reader.readAsText(file);
}
