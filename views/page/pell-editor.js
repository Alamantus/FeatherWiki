import { gallery } from '../gallery';

export const editor = (state, emit) => {
  const { init, exec } = pell; // From `window`
  const { src, edits } = state;
  const { content } = edits;
  const c = FW.inject.img(content, state, true);
  let element = document.querySelector('#e');
  if (src) {
    element = html`<textarea onchange=${e => state.edits.content = e.target.value}>${FW.img.abbr(content)}</textarea>`;
  } else {
    if (!element) {
      const fb = 'formatBlock';
      element = init({
        element: html`<div id=e class=ed></div>`, // Setting id here helps prevent re-render when other fields are changed
        onChange: val => state.edits.content = val,
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
            result: () => FW.img.upload(state, insert),
          },
          {
            title: 'Add Existing Image',
            icon: '📎',
            result: () => document.getElementById('g').showModal(),
          },
        ],
      });
      element.isSameNode = () => true; // Do not re-render editor
    }
    element.content.innerHTML = c;
  }

  return [
    element,
    html`<div class="w1 tr pb">
      <button onclick=${toggleShowSource}>${src ? 'Show Editor' : 'Show HTML'}</button>
    </div>`,
    html`<dialog id=g>
      <form class=fr method=dialog>
        <button>Close</button>
      </form>
      ${ gallery(state, () => {}, { insert: (e, i) => FW.img.put(e, i, insert) }) }
    </dialog>`,
  ];

  function insert (i) {
    const editor = element.children[1];
    if (document.activeElement !== editor) editor.focus();
    exec('insertHTML', `<p><img src="${i.img}#${i.id}"></p>`);
  }

  function toggleShowSource (e) {
    e.preventDefault();
    state.src = !src;
    emit(state.events.RENDER);
  }
}
