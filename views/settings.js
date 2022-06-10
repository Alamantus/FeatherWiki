import { gallery } from './gallery';

export const settingsView = (state, emit) => {
  const { events, p, c, j } = state;
  const o = p.pages.map(pg => pg.slug).join('\n');
  return [
    html`<header>
      <h1>Wiki Settings</h1>
    </header>`,
    html`<article class=mw>
      <form onsubmit=${saveSettings} class=pb>
        <label for=wTitle>Wiki Title</label>
        <input class=w1 id=wTitle value=${p.name} minlength=1 required>
        <label for=wDesc>Wiki Description</label>
        <input class=w1 id=wDesc value=${p.desc}>
        <label for=home>Home Page</label>
        <select id=home>
          <option value="" selected=${!p.home}>All Pages (default)</option>
          ${
            p.pages.map(pg => {
              return html`<option selected=${pg.id === p.home} value=${pg.id}>${pg.name} (${pg.slug})</option>`;
            })
          }
        </select>
        <label for=wPo>Page Order</label>
        <textarea id=wPo>${o}</textarea>
        <label for=wCss>Custom CSS</label>
        <textarea id=wCss>${c}</textarea>
        <label for=wJs>Custom JS</label>
        <span class=h>Only runs once on wiki load. To test, save your wiki & load that file.</span>
        <textarea id=wJs>${j}</textarea>
        <label for=wOut>Include Static HTML</label>
        <input id=wOut type=checkbox checked=${p.static ?? false}>
        <span class=h>Include your wiki content in simple HTML for non-JS browsers. Nearly doubles output size.</span>
        <label for=wPub>Publish</label>
        <input id=wPub type=checkbox checked=${p.published ?? false}>
        <span class=h>Hides Save, New Page, & Wiki Settings buttons. You will need to manually visit <code>?page=s</code> to unset this when set.</span>
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
    state.p.static = form.wOut.checked;
    state.p.published = form.wPub.checked;
    emit(events.CHECK_CHANGED);
    emit(events.NOTIFY, 'Settings updated');
  }

  function promptOverwrite () {
    FW.upload('text/html', file => {
      FW.xtr(file, result => {
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
      if (state.j !== content) alert('You must save & reload to run your JavaScript');
      state.j = content;
    } else {
      delete state.j;
    }
  }
}