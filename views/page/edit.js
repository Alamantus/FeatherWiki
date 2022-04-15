import html from 'choo/html';
import raw from 'choo/html/raw';
import { init } from 'pell';

export const pageEdit = (state, emit, page) => {
  const { slugify } = state.help;

  setTimeout(initEdit, 100);
  return html`<form onsubmit=${save}>
    <header>
      <h1>Edit Page</h1>
      <div class=r>
        <div class="c w12">
          <label for=pName>Page Title</label>
          <input id=pName value=${page.name} required minlength=2>
        </div>
        <div class="c w12">
          <label for=slug>Page Slug</label>
          <input id=slug value=${page.slug} required minlength=2>
          <button onclick=${slugifyTitle}>Slugify Title</button>
        </div>
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

  function slugifyTitle (e) {
    e.preventDefault();
    document.getElementById('slug').value = slugify(document.getElementById('pName').value.trim());
  }

  function save (e) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = form.pName.value.trim();
    if (name.length < 1) return alert('Page Title cannot be blank.');
    const slug = form.slug.value.trim();
    if (slug.length < 2) return alert('Page Slug must be more than 1 character long.');
    page.name = name;
    page.slug = slugify(slug);
    page.content = state.editStore;
    page.tags = form.tags.value.split(',').map(tag => tag.trim());
    emit(state.events.UPDATE_PAGE, page);
  }
}