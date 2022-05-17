import html from 'choo/html';
import { init, exec } from 'pell';

import { gallery } from '../gallery';
import { injectImageById, truncateImages } from '../../helpers/injection';
import { promptImageUpload, insertImg } from '../../helpers/handleImage';

export const editor = (state, emit) => {
  const { showSource, editStore } = state;
  const c = injectImageById(editStore.content, state, true);
  let element;
  if (showSource) {
    element = html`<textarea onchange=${e => state.editStore.content = e.target.value}>${truncateImages(editStore.content)}</textarea>`;
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
          result: () => promptImageUpload(state, insert),
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
    html`<div class="w1 tr pb">
      <button onclick=${toggleShowSource}>${showSource ? 'Show Editor' : 'Show HTML'}</button>
    </div>`,
    html`<dialog id=gal>
      <form class=fr method=dialog>
        <button>Close</button>
      </form>
      ${ gallery(state, () => {}, { insert: (e, i) => insertImg(e, i, insert) }) }
    </dialog>`,
  ];

  function insert (i) {
    const editor = element.children[1];
    if (document.activeElement !== editor) editor.focus();
    exec('insertHTML', `<p><img src="${i.img}#${i.id}"></p>`);
  }

  function toggleShowSource (e) {
    e.preventDefault();
    state.showSource = !showSource;
    emit(state.events.RENDER);
  }
}
