import { decompress } from 'json-compress';

export function extractFeatherWikiData(file, callback = () => {}) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const matches = e.target.result.match(/(?<=\<script id=p type=application\/json\>).+?(?=\<\/script\>)/g);
    if ((matches ?? []).length < 1) return alert('Could not find importable {{package.json:title}} data.');
    matches.forEach(m => {
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
