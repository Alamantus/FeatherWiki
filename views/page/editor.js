import html from 'choo/html';
import { init, exec } from 'pell';

import { gallery } from '../gallery';
import { hashString } from '../../helpers/hashString';
import { injectImageById } from '../../helpers/injection';
import { resizeImage } from '../../helpers/resizeImage';

export const editor = (state) => {
  const c = injectImageById(state.editStore.content, state, true);
  let element;
  const textChange = event => state.editStore.content = event.target.value;
  if (state.showSource) {
    element = html`<textarea class=editor onchange=${textChange}>${c}</textarea>`;
  } else {
    element = html`<article class=pell></article>`;
    const editor = init({
      element,
      onChange: html => state.editStore.content = html,
      defaultParagraphSeparator: 'p',
      actions: [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'heading1',
        'heading2',
        'paragraph',
        'quote',
        'olist',
        'ulist',
        'code',
        'link',
        {
          name: 'externalimage',
          title: 'Link External Image',
          icon: '🖼',
          result: () => {
            const url = window.prompt('Enter the image URL');
            if (url) exec('insertImage', url);
          },
        },
        {
          name: 'insertimage',
          title: 'Insert Image from File',
          icon: '📷',
          result: promptImageUpload,
        },
        {
          name: 'addImage',
          title: 'Add Existing Image in Wiki',
          icon: '📸',
          result: () => document.getElementById('gal').showModal(),
        },
      ],
    });
    editor.content.innerHTML = c;
  }

  element.isSameNode = target => {
    return target?.nodeName === element?.nodeName;
  };

  return [
    element,
    html`<dialog id=gal>
      <form class=fr method=dialog>
        <button>Close</button>
      </form>
      ${ gallery(state, () => {}, { insert: (e, i) => insertImg(e, i) }) }
    </dialog>`,
  ];

  function promptImageUpload () {
    const input = html`<input type="file" hidden accept="image/*" onchange=${onChange} />`;
    document.body.appendChild(input);
    input.click();

    function onChange(e) {
      const { files } = e.target;
      if (files.length > 0) {
        resizeImage(files[0], result => {
          if (result) {
            const editor = document.getElementsByClassName('pell-content')[0];
            if (document.activeElement !== editor) editor.focus();
            const id = hashString(result);
            state.p.img[id.toString()] = result;
            exec('insertHTML', `<p><img src="${result}#${id}"></p>`);
          }
          document.body.removeChild(input);
        });
      }
    }

  }

  function insertImg (e, i) {
    e.preventDefault();
    document.getElementById('gal').close();
    const editor = document.getElementsByClassName('pell-content')[0];
    if (document.activeElement !== editor) editor.focus();
    const { id, img } = i;
    exec('insertHTML', `<p><img src="${img}#${id}"></p>`);
  }
}
