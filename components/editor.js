import html from 'choo/html';
import Component from 'choo/component';
import { init } from 'pell';

export class Editor extends Component {
  constructor (id, state, emit) {
    super(id)
    this.state = state;
  }

  load (element) {
    const editor = init({
      element,
      onChange: html => this.state.editStore.content = html,
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
    editor.content.innerHTML = this.state.editStore.content;
  }

  update() {
    return false;
  }

  createElement () {
    return html`<article id=editor></article>`;
  }
}