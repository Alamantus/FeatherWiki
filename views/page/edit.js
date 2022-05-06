import html from 'choo/html';
// import { Editor } from '../../components/editor';
import { editor } from './editor';

export const pageEdit = (state, emit, page) => {
  const { slugify } = state.help;
  const { editStore, showSource, p, help } = state;
  const children = help.getChildren(page).map(c => c.id);

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
    ${ editor(state, emit) }
    <div class="w1 tr pb">
      <button onclick=${toggleShowSource}>${showSource ? 'Show Editor' : 'Show HTML'}</button>
    </div>
    <footer class=r>
      <div class="c w13">
        <label for=tags>Page Tags</label>
        <input id=tags
          value=${ editStore.tags } placeholder="Comma, Separated, List" onchange=${store}>
        <select onchange=${addTag}>
          <option value="" selected disabled>Add Existing Tag</option>
          ${
            state.t.filter(t => !editStore.tags.split(',').includes(t))
              .map(t => {
                return html`<option>${t}</option>`;
              })
          }
        </select>
      </div>
      <div class="c w13">
        <label for=parent>Parent</label>
        <select id=parent onchange=${store}>
          <option value="" selected=${editStore.parent === ''}>None</option>
          ${
            p.pages.filter(pg => {
              return pg.id !== page?.id && !children.includes(pg.id);
            }).map(pg => {
                return html`<option selected=${pg.id === editStore.parent} value=${pg.id}>${pg.name} (${pg.slug})</option>`;
              })
          }
        </select>
      </div>
      <div class="c w13 tr">
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

  function toggleShowSource (e) {
    e.preventDefault();
    state.showSource = !state.showSource;
    emit(state.events.RENDER);
  }

  function getTagsArray () {
    const tags = document.getElementById('tags').value.split(',').map(t => t.trim());
    return tags.filter((t, i) => {
      return t.length > 0 && tags.indexOf(t) === i;
    }).sort();
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
    pg = { ...page };
    pg.name = name;
    pg.slug = slugify(slug);
    pg.content = state.editStore.content.replace(/(?<=<img src=")[^"]+#([-\d]+)(" style="font-size: \d+pt;)?(?=">)/g, 'img:$1:img');
    pg.tags = getTagsArray().join(',');
    pg.parent = form.parent.value;
    emit(state.events.UPDATE_PAGE, pg);
  }
}