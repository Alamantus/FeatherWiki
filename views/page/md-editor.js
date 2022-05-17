import html from 'choo/html';

import { gallery } from '../gallery';
import { hashString } from '../../helpers/hashString';
import { injectImageById } from '../../helpers/injection';
import { resizeImage } from '../../helpers/resizeImage';
import { uploadFile } from '../../helpers/uploadFile';

export const editor = (state) => {
  const c = injectImageById(state.editStore.content, state, true);
  const textChange = event => state.editStore.content = event.target.value;
  const element = html`<textarea onchange=${textChange}>${c}</textarea>`;
  const gal = () => document.getElementById('gal');

  return [
    element,
    html`<button onclick=${e => promptImageUpload(e)}>Insert Image from File</button>`,
    html`<button onclick=${e => {e.preventDefault(); gal().showModal()}}>Add Existing Image</button>`,
    html`<dialog id=gal>
      <form class=fr method=dialog>
        <button>Close</button>
      </form>
      ${ gallery(state, () => {}, { insert: (e, i) => insertImg(e, i) }) }
    </dialog>`,
  ];

  function focus() {
    if (document.activeElement !== element) element.focus();
  }
  
  function insert (text) {
    focus();
    if (document.selection) {
      // IE
      const sel = document.selection.createRange();
      sel.text = text;
    } else if (element.selectionStart || element.selectionStart === 0) {
      // Others
      var startPos = element.selectionStart;
      var endPos = element.selectionEnd;
      element.value = element.value.substring(0, startPos) +
        text +
        element.value.substring(endPos, element.value.length);
      element.selectionStart = startPos + text.length;
      element.selectionEnd = startPos + text.length;
    } else {
      element.value += text;
    }
    textChange({ target: element });
  };

  function promptImageUpload (e) {
    e.preventDefault();
    if (!confirm('Inserting an image will increase your wiki\'s file size. Continue?')) return;
    uploadFile('image/*', file => {
      resizeImage(file, result => {
        if (result) {
          focus();
          const id = hashString(result);
          state.p.img[id.toString()] = result;
          insert(`![inserted image](img:${id}:img)`);
        }
      });
    });
  }

  function insertImg (e, i) {
    e.preventDefault();
    gal().close();
    focus();
    const { id } = i;
    insert(`![inserted image](img:${id}:img)`);
  }
}
