/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
import { gallery } from './gallery';

export const settingsView = (state, emit) => {
  const { events, p, c, j } = state;
  const o = p.pages.map(pg => pg.slug).join('\n');
  return [
    html`<header>
      <h1>{{translate:wikiSettings}}</h1>
    </header>`,
    html`<article class=mw>
      <form onsubmit=${saveSettings} class=pb>
        <label for=wTitle>{{translate:wikiTitle}}</label>
        <input class=w1 id=wTitle value=${p.name} minlength=1 required>
        <label for=wDesc>{{translate:wikiDescription}}</label>
        <input class=w1 id=wDesc value=${p.desc}>
        <label for=home>{{translate:homePage}}</label>
        <select id=home>
          <option value="" selected=${!p.home}>{{translate:allPages}} ({{translate:default}})</option>
          ${
            p.pages.map(pg => {
              return html`<option selected=${pg.id === p.home} value=${pg.id}>${pg.name} (${pg.slug})</option>`;
            })
          }
        </select>
        <label for=wPo>{{translate:pageOrder}}</label>
        <textarea id=wPo class=notab>${o}</textarea>
        <label for=wCss>{{translate:customCss}}</label>
        <textarea id=wCss>${c}</textarea>
        <label for=wJs>{{translate:customJs}}</label>
        <span class=h>{{translate:customJsHelpText}}</span>
        <textarea id=wJs>${j}</textarea>
        <label for=wHead>{{translate:customHead}}</label>
        <span class=h>{{translate:customHeadHelpText}}</span>
        <textarea id=wHead>${FW.inject.esc(p.head, true)}</textarea>
        <label for=wOut>{{translate:includeStaticHtml}}</label>
        <input id=wOut type=checkbox checked=${p.static ?? false}>
        <span class=h>{{translate:includeStaticHtmlHelpText}}</span>
        <label for=wPub>{{translate:publish}}</label>
        <input id=wPub type=checkbox checked=${p.published ?? false}>
        <span class=h>{{translate:publishHelpText}} <code>?page=s</code></span>
        <div class=tr>
          <button type="submit">{{translate:update}}</button>
        </div>
      </form>
      <div class=tr>
        <p class="pb h">
          {{package.json:title}} {{translate:version}}: {{package.json:version}}
        </p>
        <p>
          <button class=del onclick=${() => promptOverwrite()}>{{translate:importButton}}</button>
        </p>
      </div>
      ${ gallery(state, emit, { showDelete: true, showUsed: true })}
    </article>`
  ];

  function saveSettings(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = form.wTitle.value.trim();
    if (title.length < 1) return alert('{{translate:titleRequiredError}}');
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
    if (form.wHead.value.trim()) {
      // Store this with angle braces removed in case users add script tags
      state.p.head = FW.inject.esc(form.wHead.value);
    } else {
      delete state.p.head;
    }
    state.p.static = form.wOut.checked;
    state.p.published = form.wPub.checked;
    emit(events.CHECK_CHANGED);
    emit(events.NOTIFY, '{{translate:settingsUpdated}}');
  }

  function promptOverwrite () {
    FW.upload('text/html', file => {
      FW.xtr(file, result => {
        if (result) {
          state.p = result[0];
          handleCustomCss(result[1]);
          handleCustomJs(result[2]);
          emit(events.ONLOAD);
          emit(events.CHECK_CHANGED);
          emit(events.NOTIFY, '{{translate:wikiLoaded}}');
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
      if (state.j !== content) alert('{{translate:reloadCustomJsAlert}}');
      state.j = content;
    } else {
      delete state.j;
    }
  }
}