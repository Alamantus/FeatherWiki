import html from 'choo/html';
import { init } from 'pell';

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
      'image',
    ],
  });
  editor.content.innerHTML = state.editStore.content;

  return element;
}
