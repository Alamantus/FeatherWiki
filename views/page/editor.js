import html from 'choo/html';
import { init, exec } from 'pell';
import { hashString } from '../../helpers/hashString';

import { resizeImage } from '../../helpers/resizeImage';

export const editor = (state) => {
  let element = html`<article id="editor"></article>`;
  element.isSameNode = () => true;

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
    ],
  });
  editor.content.innerHTML = state.editStore.content;

  return element;

  function promptImageUpload () {
    const input = html`<input type="file" hidden accept="image/*" onchange=${onChange} />`;
    document.body.appendChild(input);
    input.click();

    function onChange(e) {
      const { files } = e.target;
      if (files.length > 0) {
        resizeImage(files[0], result => {
          if (result) {
            const id = hashString(result);
            state.p.img[id.toString()] = result;
            exec('insertHTML', `<img src=img:${id}:img>`);
          }
          document.body.removeChild(input);
        });
      }
    }
  }
}
