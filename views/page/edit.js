import html from 'choo/html';
import raw from 'choo/html/raw';
import { init } from 'pell';

export const pageEdit = (state, emit, page) => {
  setTimeout(initEdit, 100);
  return html`<form onsubmit=${save}>
    <header>
      <h1>
        <label for=pName class=sr>Page Title</label>
        <input id=pName value=${page.name} placeholder="Page Title" required minlength=1>
      </h1>
    </header>
    <article id=editor></article>
    <footer class=r>
      <div class="c w34">
        <label for=tags>Page Tags</label>
        <input id=tags value=${ page?.tags ? page.tags.join(', ') : '' } placeholder="Comma, Separated, List">
      </div>
      <div class="c w14 tr">
        <button type=submit>Save</button>
      </div>
    </footer>
  </form>`;

  function initEdit () {
    const editor = init({
      element: document.getElementById('editor'),
      onChange: html => state.editStore = html,
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
    editor.content.innerHTML = page.content ?? '';
  }

  function save (e) {
    e.preventDefault();
    const form = e.currentTarget;
    page.name = form.pName.value;
    page.content = state.editStore;
    page.tags = form.tags.value.split(',').map(tag => tag.trim());
    emit(state.events.UPDATE_PAGE, page);
  }
}