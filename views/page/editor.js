import html from 'choo/html';
import { init, exec } from 'pell';

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
        if (validFileType(files[0])) {
          resizeImage(files[0], result => {
            if (result) exec('insertImage', result);
            document.body.removeChild(input);
          });
        }
      }
    }

    function validFileType(file) {
      return [
        'image/apng',
        'image/bmp',
        'image/gif',
        'image/jpeg',
        'image/pjpeg',
        'image/png',
        'image/svg+xml',
        'image/tiff',
        'image/webp',
        'image/x-icon',
      ].includes(file.type);
    }
  }
}
