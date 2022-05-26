import { decompress } from './jsonCompress';

export function extractFeatherWikiData (file, callback = () => {}) {
  const reader = new FileReader();
  reader.onload = async event => {
    const file = event.target.result;
    const pString = matchHtml(file, 'script', 'p type=application/json');
    // validate that wiki data exists and is probably JSON
    if (!pString.length || pString[0] !== '{') return alert('Could not find {{package.json:title}} data.');
    const pData = decompress(JSON.parse(pString));
    pData.img = await migrateImg(pData.img);
    callback([
      pData,
      matchHtml(file, 'style', 'c'),
      matchHtml(file, 'script', 'j'),
    ]);
  };
  reader.onerror = function (e) {
    if (process.env.NODE_ENV !== 'production') console.error(e);
    callback(null);
  };
  reader.readAsText(file);
}

function matchHtml (source, element, id) {
  // The '\\s' in each regex start string makes sure it doesn't match *that* line but does match the HTML with a space before it.
  // Feather Wiki's HTML output has spaces between elements, which is important in this case because it helps us match the content.
  const start = `\\s<${element} id=${id}>`; // Start of custom CSS regular expression.
  const match = source.match(new RegExp(start + `.+?(?=</${element}>)`, 's'));
  return ((match ?? []).length) ? match[0].replace(start.replace('\\s', ''), '').trim() : '';
}

async function migrateImg (img) {
  const imgIds = Object.keys(img);
  if (imgIds.length && !img[imgIds[0]].img) {
    await Promise.all(
      imgIds.map(id => {
        return new Promise(resolve => {
          const i = new Image();
          i.src = img[id];
          i.onload = () => {
            img[id] = {
              img: img[id],
              alt: 'image',
              size: [i.width, i.height],
            };
            resolve();
          };
        })
      })
    );
  }
  return img;
}
