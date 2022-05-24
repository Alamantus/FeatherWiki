import { slugify, tidyArray } from '../../helpers/formatting';
import { truncateImages } from '../../helpers/injection';

export const pageEdit = (state, emit, page) => {
  const { edits, p, help } = state;
  const children = help.getChildren(page).map(c => c.id);
  const isNew = !p.pages.some(pg => pg.id === page.id);

  let editor;
  if (process.env.EDITOR === 'md') {
    editor = require('./md-editor').editor(state, emit);
  } else if (process.env.EDITOR === 'html') {
    editor = require('./pell-editor').editor(state, emit);
  } else {
    const { useMd } = edits;
    editor = [
      html`<div class="w1 tr">
        <button onclick=${toggleEditor}>${useMd ? 'Use Editor' : 'Use Markdown'}</button>
      </div>`,
      require(useMd ? './md-editor' : './pell-editor').editor(state, emit),
    ];
  }

  return html`<form onsubmit=${save}>
    <header>
      <h1>Edit Page</h1>
      <div class=r>
        <div class="c w12">
          <label for=name>Page Title</label>
          <input id=name value=${edits.name} required minlength=2 onchange=${store}>
        </div>
        <div class="c w12">
          <label for=slug>Page Slug</label>
          <input id=slug value=${edits.slug} required minlength=2 onchange=${store}>
          <button onclick=${slugifyTitle}>Slugify Title</button>
        </div>
    </header>
    ${ editor }
    <footer class=r>
      <div class="c w13">
        <label for=tags>Page Tags</label>
        <input id=tags
          value=${ edits.tags } placeholder="Comma, Separated, List" onchange=${store}>
        <select onchange=${addTag}>
          <option value="" selected disabled>Add Existing Tag</option>
          ${
            state.t.filter(t => !edits.tags.split(',').includes(t))
              .map(t => {
                return html`<option>${t}</option>`;
              })
          }
        </select>
      </div>
      <div class="c w13">
        <label for=parent>Parent</label>
        <select id=parent onchange=${store}>
          <option value="" selected=${edits.parent === ''}>None</option>
          ${
            p.pages.filter(pg => {
              return pg.id !== page?.id && !children.includes(pg.id);
            }).map(pg => {
                return html`<option selected=${pg.id === edits.parent} value=${pg.id}>${pg.name} (${pg.slug})</option>`;
              })
          }
        </select>
      </div>
      <div class="c w13 tr">
        <div class=pb><button type=submit>Save</button></div>
        ${
          !isNew
          ? html`<div><button class=del onclick=${e => deletePage(e)}>Delete</button></div>`
          : ''
        }
      </div>
    </footer>
  </form>`;

  function slugifyTitle (e) {
    e.preventDefault();
    document.getElementById('slug').value = slugify(document.getElementById('name').value.trim());
  }

  function toggleEditor (e) {
    if (process.env.EDITOR === 'both') {
      e.preventDefault();
      const { useMd, content } = edits;
      if (useMd) {
        if (!confirm('Your markdown will be converted to HTML. Continue?')) return;
        state.edits.content = require('../../helpers/snarkdownEnhanced').default(content);
      }
      state.edits.useMd = !useMd;
      emit(state.events.RENDER);
    }
  }

  function store (e) {
    const t = e.target;
    state.edits[t.id] = t.value;
    emit(state.events.RENDER);
  }

  function getTagsArray () {
    return tidyArray(document.getElementById('tags').value.split(','));
  }
  
  function addTag (e) {
    const tag = e.target.value;
    if (tag.length > 0) {
      const tags = getTagsArray();
      if (!tags.includes(tag)) {
        edits.tags += (tags.length > 0 ? ',' : '') + tag;
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
    pg.content = truncateImages(state.edits.content);
    pg.tags = getTagsArray().join(',');
    pg.parent = form.parent.value;
    if (process.env.EDITOR !== 'html') {
      if (edits.useMd) pg.editor = 'md'; else delete pg.editor;
    }
    emit(state.events.UPDATE_PAGE, pg);
  }

  function deletePage (e) {
    e.preventDefault();
    if (confirm('You can\'t undo this after saving your wiki! Delete this page?')) {
      emit(state.events.DELETE_PAGE, page.id);
    }
  }
}