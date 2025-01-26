/**
 * Modified from pell, the simplest and smallest WYSIWYG text editor for web, with no dependencies
 * https://github.com/jaredreich/pell
 * 
 * Several customization options have been removed to work with Feather Wiki specifically.
 * 
 * @licence MIT
 */

// Shorten the names of these to help the minifier
const fb = 'formatBlock';
const ael = (parent, type, listener) => parent.addEventListener(type, listener);
const ac = (parent, child) => parent.appendChild(child);
const qcs = command => document.queryCommandState(command);
const ex = (command, value = null) => document.execCommand(command, false, value);

let edUc;

export const bar = [
  { // clear
    icon: '☒',
    title: '{{translate:clearFormattingHelpText}}',
    result: () => ex('removeFormat')
  },
  { // bold
    icon: '<b>B</b>',
    title: '{{translate:boldHelpText}}',
    state: () => qcs('bold'),
    result: () => ex('bold')
  },
  { // italic
    icon: '<i>I</i>',
    title: '{{translate:italicHelpText}}',
    state: () => qcs('italic'),
    result: () => ex('italic')
  },
  { // underline
    icon: '<u>U</u>',
    title: '{{translate:underlineHelpText}}',
    state: () => qcs('underline'),
    result: () => ex('underline')
  },
  // { // strikethrough
  //   icon: '<strike>S</strike>',
  //   title: 'Strike-through',
  //   state: () => qcs('strikeThrough'),
  //   result: () => ex('strikeThrough')
  // },
  { // heading2
    icon: '<b>H</b>',
    title: '{{translate:headingHelpText}}',
    result: () => ex(fb, '<h2>'),
  },
  { // heading3
    icon: '<b>H<sub>2</sub></b>',
    title: '{{translate:subheadingHelpText}}',
    result: () => ex(fb, '<h3>'),
  },
  { // paragraph
    icon: '¶',
    title: '{{translate:paragraphHelpText}}',
    result: () => ex(fb, '<p>')
  },
  { // align left
    icon: '↦',
    title: '{{translate:alignLeftHelpText}}',
    state: () => qcs('justifyLeft'),
    result: () => ex('justifyLeft')
  },
  { // align center
    icon: '↔',
    title: '{{translate:alignCenterHelpText}}',
    state: () => qcs('justifyCenter'),
    result: () => ex('justifyCenter')
  },
  { // align right
    icon: '↤',
    title: '{{translate:alignRightHelpText}}',
    state: () => qcs('justifyRight'),
    result: () => ex('justifyRight')
  },
  { // olist
    icon: '#',
    title: '{{translate:numberListHelpText}}',
    result: () => ex('insertOrderedList')
  },
  { // ulist
    icon: '•',
    title: '{{translate:bulletListHelpText}}',
    result: () => ex('insertUnorderedList')
  },
  { // quote
    icon: '“ ”',
    title: '{{translate:quoteHelpText}}',
    result: () => ex(fb, '<blockquote>')
  },
  // { // code
  //   icon: '&lt;/&gt;',
  //   title: 'Code',
  //   result: () => ex(fb, '<pre>')
  // },
  { // line
    icon: '―',
    title: '{{translate:separatorHelpText}}',
    result: () => ex('insertHorizontalRule')
  },
  { // link
    icon: '🔗',
    title: '{{translate:linkHelpText}}',
    result: () => {
      const url = window.prompt('{{translate:linkPromptText}}')
      if (url) ex('createLink', url)
    }
  },
  { // externalImage
    icon: '🖼️',
    title: '{{translate:linkExternalImageHelpText}}',
    result: () => {
      const url = window.prompt('{{translate:linkExternalImagePrompt}}');
      if (url) ex('insertImage', url);
    },
  },
  { // insertImage
    icon: '📸',
    title: '{{translate:insertImageHelpText}}',
    result: () => FW.img.upload(FW.state, edUc.ins),
  },
  { // existingImage
    icon: '📎',
    title: '{{translate:addExistingImageHelpText}}',
    result: () => FW.emit(FW.state.events.RENDER, () => document.getElementById('g').showModal()),
  },
];

export const init = settings => {
  const current = document.querySelector('#e');
  if (current && !settings.rebuild) return current;

  current?.parentNode.removeChild(current);
  const el = html`<div id=e class=ed></div>`;
  edUc = el.edUc = html`<div class="ed-uc" contenteditable="true" oninput=${({ target: { firstChild } }) => {
    if (firstChild && firstChild.nodeType === 3) ex(fb, '<p>');
    else if (edUc.innerHTML === '<br>') edUc.innerHTML = '';
    settings.onChange(edUc.innerHTML);
  }} onkeydown=${event => {
    if (event.key === 'Enter' && document.queryCommandValue(fb).match(/blockquote|h\d/)) {
      setTimeout(() => ex(fb, '<p>'), 0);
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      setTimeout(() => ex(event.shiftKey ? 'outdent' : 'indent'), 0);
    }
  }}></div>`;
  edUc.ins = i => {
    if (document.activeElement !== edUc) edUc.focus();
    ex('insertHTML', `<p><img src="${i.img}#${i.id}"></p>`);
  };

  const barHtml = html`<div class=ed-bar role=toolbar>
    ${(ed.bar ?? bar).map(b => {
      const button = html`<button class=ed-btn type=button title="${b.title}" onclick=${() => b.result() && edUc.focus()}>
        ${html.raw(b.icon)}
      </button>`;

      if (b.state) {
        const handler = () => button.classList[b.state() ? 'add' : 'remove']('ed-sel');
        ael(edUc, 'keyup', handler);
        ael(edUc, 'mouseup', handler);
        ael(button, 'click', handler);
      }

      return button;
    })}
  </div>`;
  ac(el, barHtml);
  ac(el, edUc);

  ex('defaultParagraphSeparator', 'p');

  return el;
}

export default { bar, init };
