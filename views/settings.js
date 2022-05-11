import html from 'choo/html';

import { gallery } from './gallery';
import { uploadFile } from '../helpers/uploadFile';
import { extractFeatherWikiData } from '../helpers/extractFeatherWikiData';

export const settingsView = (state, emit) => {
  const { events, p } = state;
  return [
    html`<header>
      <h1>Wiki Settings</h1>
    </header>`,
    html`<article>
      <form onsubmit=${saveSettings} class=pb>
        <div class=r>
          <label class="c tr ml w14" for=wTitle>Wiki Title</label>
          <div class="c w34">
            <input class=w1 id=wTitle value=${p.name} minlength=1 required>
          </div>
        </div>
        <div class=r>
          <label class="c tr ml w14" for=wDesc>Wiki Description</label>
          <div class="c w34">
            <input class=w1 id=wDesc value=${p.desc}>
          </div>
        </div>
        <div class=r>
          <label class="c tr ml w14" for=home>Home Page</label>
          <div class="c w34">
            <select id=home>
              <option value="" selected=${!p.home}>All Pages (default)</option>
              ${
                p.pages.map(pg => {
                  return html`<option selected=${pg.id === p.home} value=${pg.id}>${pg.name} (${pg.slug})</option>`;
                })
              }
            </select>
          </div>
        </div>
        <div class=r>
          <label class="c tr ml w14" for=wPub>Publish</label>
          <div class="c w34">
            <input id=wPub type=checkbox checked=${p.published ?? false}>
            <span class=h>Hides Save, New Page, & Wiki Settings buttons. You will need to manually visit <code>?page=s</code> to unset this when set.</span>
          </div>
        </div>
        <div class=tr>
          <button type="submit">Update</button>
        </div>
      </form>
      <div class=tr>
        <button class=del onclick=${() => promptOverwrite()}>Import & Overwrite with Other {{package.json:title}} file</button>
      </div>
      ${ gallery(state, emit, { showDelete: true, showUsed: true })}
    </article>`
  ];

  function saveSettings(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = form.wTitle.value.trim();
    if (title.length < 1) return alert('Title is required');
    state.p.name = title;
    state.p.desc = form.wDesc.value.trim();
    if (form.home.value.length > 1) {
      state.p.home = form.home.value;
    } else {
      delete state.p.home;
    }
    state.p.published = form.wPub.checked;
    emit(events.CHECK_CHANGED);
  }

  function promptOverwrite () {
    uploadFile('text/html', file => {
      extractFeatherWikiData(file, result => {
        if (result) {
          state.p = result;
          emit(events.DOMCONTENTLOADED);
          emit(events.CHECK_CHANGED);
        }
      });
    });
  }
}