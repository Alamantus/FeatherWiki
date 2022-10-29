/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
export const pageEdit = (state, emit, page) => {
  const { events, edits, p, help } = state;
  const children = help.getChildren(page).map(c => c.id);
  const isNew = !p.pages.some(pg => pg.id === page.id);

  const { useMd } = edits;
  function toggleEditor (e) {
    e.preventDefault();
    const { useMd, content } = edits;
    if (useMd) {
      if (!confirm('Your markdown will be converted to HTML. Continue?')) return;
      state.edits.content = md(content);
    } else {
      state.edits.content = FW.img.abbr(content);
    }
    state.edits.useMd = !useMd;
    emit(events.RENDER);
  }
  const editor = [
    html`<div class="w1 tr">
      <button onclick=${toggleEditor}>${useMd ? 'Use Editor' : 'Use Markdown'}</button>
    </div>`,
    require(useMd ? './md-editor' : './pell-editor').editor(state, emit),
  ];

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
    <span class=h style=float:left>Use [[Page Title]] or [[text|page_slug]] for internal links.</span>
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
        <label>Hide Page <input type=checkbox id=hide onchange=${e => state.edits.hide = e.target.checked} checked=${edits.hide} /></label>
      </div>
      <div class="c w13 tr">
        <div class=pb><button type=submit>Save</button></div>
        ${
          !isNew
          ? [
            html`<div class=pb><button onclick=${e => {e.preventDefault(); emit(events.CANCEL_EDIT)}}>Cancel</button></div>`,
            html`<div><button class=del onclick=${e => deletePage(e)}>Delete</button></div>`,
          ] : ''
        }
      </div>
    </footer>
  </form>`;

  function slugifyTitle (e) {
    e.preventDefault();
    document.getElementById('slug').value = FW.slug(document.getElementById('name').value.trim());
  }

  function store (e) {
    const t = e.target;
    state.edits[t.id] = t.value;
    emit(events.RENDER);
  }

  function getTagsArray () {
    return FW.tidy(document.getElementById('tags').value.split(','));
  }
  
  function addTag (e) {
    const tag = e.target.value;
    if (tag.length > 0) {
      const tags = getTagsArray();
      if (!tags.includes(tag)) {
        edits.tags += (tags.length > 0 ? ',' : '') + tag;
        emit(events.RENDER);
      }
    }
    e.target.value = '';
  }

  function save (e) {
    e.preventDefault();
    const f = e.currentTarget;
    const n = f.name.value.trim();
    if (n.length < 1) return alert('Page Title cannot be blank.');
    const slug = f.slug.value.trim();
    if (slug.length < 2) return alert('Page Slug must be more than 1 character long.');
    const pg = { ...page };
    pg.name = n;
    pg.slug = FW.slug(slug);
    pg.content = FW.img.abbr(state.edits.content);
    pg.tags = getTagsArray().join(',');
    pg.parent = f.parent.value;
    if (f.hide.checked) pg.hide = true; else delete pg.hide;
    if (f.hide.checked) pg.hide = true; else delete pg.hide;
    if (edits.useMd) pg.editor = 'md'; else delete pg.editor;
    emit(events.UPDATE_PAGE, pg);
  }

  function deletePage (e) {
    e.preventDefault();
    if (confirm('You can\'t undo this after saving your wiki! Delete this page?')) {
      emit(events.DELETE_PAGE, page.id);
    }
  }
}