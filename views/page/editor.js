import html from 'choo/html';
import { init, exec } from 'pell';

import { gallery } from '../gallery';
import { hashString } from '../../helpers/hashString';
import { injectImageById } from '../../helpers/injection';
import { resizeImage } from '../../helpers/resizeImage';
import { uploadFile } from '../../helpers/uploadFile';

export const editor = (state) => {
  const c = injectImageById(state.editStore.content, state, true);
  let element;
  const textChange = event => state.editStore.content = event.target.value;
  if (state.showSource) {
    element = html`<textarea onchange=${textChange}>${c}</textarea>`;
  } else {
    element = html`<article class=pell></article>`;
    const fb = 'formatBlock';
    const editor = init({
      element,
      onChange: html => state.editStore.content = html,
      defaultParagraphSeparator: 'p',
      actions: [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        {
          title: 'Heading',
          icon: '<b>H</b>',
          result: () => exec(fb, '<h2>'),
        },
        {
          title: 'Sub-Heading',
          icon: '<b>H<sub>2</sub></b>',
          result: () => exec(fb, '<h3>'),
        },
        'paragraph',
        'olist',
        'ulist',
        'quote',
        'line',
        'link',
        {
          title: 'Link External Image',
          icon: '🖼️',
          result: () => {
            const url = window.prompt('Enter the image URL');
            if (url) exec('insertImage', url);
          },
        },
        {
          title: 'Insert Image from File',
          icon: '📸',
          result: promptImageUpload,
        },
        {
          title: 'Add Existing Image',
          icon: '📎',
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

  function insert (i) {
    const editor = element.children[1];
    if (document.activeElement !== editor) editor.focus();
    exec('insertHTML', `<p><img src="${i.img}#${i.id}"></p>`);
  }

  function promptImageUpload () {
    if (!confirm('Inserting an image will increase your wiki\'s file size. Continue?')) return;
    uploadFile('image/*', file => {
      resizeImage(file, img => {
        if (img) {
          const id = hashString(img);
          state.p.img[id.toString()] = img;
          insert({ img, id });
        }
      });
    });
  }

  function insertImg (e, i) {
    e.preventDefault();
    document.getElementById('gal').close();
    insert(i);
  }
}
