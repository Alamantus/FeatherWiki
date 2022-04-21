import html from 'choo/html';
import { Editor } from '../../components/editor';

export const pageEdit = (state, emit, page) => {
  const { slugify } = state.help;
  const { editStore } = state;

  return html`<form onsubmit=${save}>
    <header>
      <h1>Edit Page</h1>
      <div class=r>
        <div class="c w12">
          <label for=name>Page Title</label>
          <input id=name value=${editStore.name} required minlength=2 onchange=${store}>
        </div>
        <div class="c w12">
          <label for=slug>Page Slug</label>
          <input id=slug value=${editStore.slug} required minlength=2 onchange=${store}>
          <button onclick=${slugifyTitle}>Slugify Title</button>
        </div>
    </header>
    ${state.cache(Editor, 'editor').render()}
    <footer class=r>
      <div class="c w34">
        <label for=tags>Page Tags</label>
        <input id=tags
          value=${ editStore.tags } placeholder="Comma, Separated, List" onchange=${store}>
        <select id=allTags onchange=${addTag}>
          <option value="" selected disabled>Add Existing Tag</option>
          ${
            state.t.filter(t => !editStore.tags.split(',').includes(t))
              .map(t => {
                return html`<option>${t}</option>`;
              })
          }
        </select>
      </div>
      <div class="c w14 tr">
        <button type=submit>Save</button>
      </div>
    </footer>
  </form>`;

  function slugifyTitle (e) {
    e.preventDefault();
    document.getElementById('slug').value = slugify(document.getElementById('name').value.trim());
  }

  function store (e) {
    const t = e.target;
    state.editStore[t.id] = t.value;
    emit(state.events.RENDER);
  }

  function getTagsArray () {
    return document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }
  
  function addTag (e) {
    const tag = e.target.value;
    if (tag.length > 0) {
      const tags = getTagsArray();
      if (!tags.includes(tag)) {
        editStore.tags += (tags.length > 0 ? ',' : '') + tag;
        emit(state.events.RENDER);
      }
    }
    e.target.value = '';
  }

  function save (e) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = form.name.value.trim();
    if (name.length < 1) return alert('Page Title cannot be blank.');
    const slug = form.slug.value.trim();
    if (slug.length < 2) return alert('Page Slug must be more than 1 character long.');
    page.name = name;
    page.slug = slugify(slug);
    page.content = state.editStore.content;
    page.tags = getTagsArray().join(',');
    emit(state.events.UPDATE_PAGE, page);
  }
}