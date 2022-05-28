import { gallery } from './gallery';
import { uploadFile } from '../helpers/uploadFile';
import { extractFeatherWikiData } from '../helpers/extractFeatherWikiData';

export const settingsView = (state, emit) => {
  const { events, p, c, j } = state;
  const o = p.pages.map(pg => pg.slug).join('\n');
  return [
    html`<header>
      <h1>Wiki Settings</h1>
    </header>`,
    html`<article class=mw>
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
          <label class="c tr ml w14" for=wPo>Page Order</label>
          <div class="c w34">
            <textarea id=wPo>${o}</textarea>
          </div>
        </div>
        <div class=r>
          <label class="c tr ml w14" for=wCss>Custom CSS</label>
          <div class="c w34">
            <textarea id=wCss>${c}</textarea>
          </div>
        </div>
        <div class=r>
          <label class="c tr ml w14" for=wJs>Custom JS</label>
          <div class="c w34">
            <span class=h>Only runs once on wiki load. To test, save your wiki & load that file.</span>
            <textarea id=wJs>${j}</textarea>
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
        <p class="pb h">
          {{package.json:title}} Version: {{buildVersion}}_{{package.json:version}}
        </p>
        <p>
          <button class=del onclick=${() => promptOverwrite()}>Import & Overwrite with Other {{package.json:title}} file</button>
        </p>
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
    // Sort pages in the specified order. Missing slugs go to the top.
    const sort = form.wPo.value.split('\n').map(s => s.trim());
    state.p.pages.sort((a, b) => sort.indexOf(a.slug) < sort.indexOf(b.slug) ? -1 : 1);
    handleCustomCss(form.wCss.value);
    handleCustomJs(form.wJs.value);
    state.p.published = form.wPub.checked;
    emit(events.CHECK_CHANGED);
    emit(events.NOTIFY, 'Settings updated');
  }

  function promptOverwrite () {
    uploadFile('text/html', file => {
      extractFeatherWikiData(file, result => {
        if (result) {
          state.p = result[0];
          handleCustomCss(result[1]);
          handleCustomJs(result[2]);
          emit(events.DOMCONTENTLOADED);
          emit(events.CHECK_CHANGED);
          emit(events.NOTIFY, 'Wiki Loaded');
        }
      });
    });
  }

  function handleCustomCss (content) {
    const style = document.getElementById('c');
    if (content.trim()) {
      state.c = content;
      if (style) style.innerHTML = content;
      else document.head.innerHTML += `<style id=c>${content}</style>`;
    } else {
      delete state.c;
      if (style) document.head.removeChild(style);
    }
  }

  function handleCustomJs (content) {
    if (content.trim()) {
      state.j = content;
      alert('You must save & reload to run your JavaScript');
    } else {
      delete state.j;
    }
  }
}