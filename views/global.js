/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
export const globalView = (state, emit) => {
  const {
    root,
    file,
    help,
    pg,
    p,
    t,
    recent,
    events,
    query,
    changed,
    sb,
    sbTab,
    views,
    notis,
  } = state;

  const showEditFields = !p.published || query.page === 's';

  const parents = p.pages.filter(page => !page.parent);
  const recents = recent.map(r => p.pages.find(pp => pp.id === r.p));

  let pageToRender = pg
    ? views.p(state, emit, pg)
    : (views[query.page ?? 'a'] ?? (() => {}))(state, emit);
  if (query.tag) {
    pageToRender = views.t(state, emit);
  }

  let saveButton = [
    changed ? html`<div>Wiki has changed!</div>` : '',
  ];
  if (state.canPut) {
    saveButton = [
      ...saveButton,
      html`<div><button class=${changed ? 'chg' : ''} title="Save wiki to ${location.origin}${root}" onclick=${() => emit(events.PUT_SAVE_WIKI)}>Save Wiki to Server</button></div>`,
      html`<div><button title="Download wiki in its current state" onclick=${() => emit(events.SAVE_WIKI)}>Save Wiki Locally</button></div>`,
    ]
  } else {
    saveButton = [
      ...saveButton,
      html`<div><button class=${changed ? 'chg' : ''} title="Download wiki in its current state" onclick=${() => emit(events.SAVE_WIKI)}>Save Wiki</button></div>`,
    ]
  }

  return html`<body>
    <main>
      <div class=sb>
        <span class=db><a href=? class=t>${p.name}</a></span>
        ${ p.desc ? html`<p class=pb>${p.desc}</p>` : ''}
        ${ showEditFields ? saveButton : '' }
        <button class=sbt onclick=${() => toggleSidebar()}>${sb ? 'Hide' : 'Show'} Menu</button>
        <nav class=${!sb ? 'n' : ''}>
          ${
            showEditFields
            ? [
              html`<p><a href="?page=s">Wiki Settings</a></p>`,
              html`<details class=pb ontoggle=${() => document.getElementById('np').focus()}>
                <summary class=np>New Page</summary>
                <form onsubmit=${createNewPage}>
                  <label class=sr for=np>New Page Title</label>
                  <input id=np placeholder="New Page Title" autocomplete=off>
                  <button type=submit>Create</button>
                </form>
              </details>`
            ] : ''
          }
          <div class=tabs>
            <button class=${sbTab === 'Pages' && 'a'} onclick=${changeTab}>Pages</button>
            ${t.length > 0 ? html`<button class=${sbTab === 'Tags' && 'a'} onclick=${changeTab}>Tags</button>` : ''}
            <button class=${sbTab === 'Recent' && 'a'} onclick=${changeTab}>Recent</button>
          </div>
          ${
            sbTab === 'Pages'
            ? html`<ul>
              ${parents.map(pp => help.getChildList(pp, true))}
              <li><a href="?page=a">All Pages</a></li>
              ${help.missing().length > 0 ? html`<li><a href="?page=m">Missing Pages</a></li>` : ''}
            </ul>` : ''
          }
          ${
            sbTab === 'Tags'
            ? html`<ul>
              ${t.map(tag => html`<li><a href="?tag=${tag}">${tag}</a></li>`)}
            </ul>` : ''
          }
          ${
            sbTab === 'Recent'
            ? html`<ul style="padding:0">
              ${recents.map(pp => html`<li>
                <a href="?page=${pp.slug}">${pp.name}</a>
                <p class=h style="margin:0">${FW.date(new Date(pp.md ?? pp.cd))}</p>
              </li>`)}
            </ul>` : ''
          }
        </nav>
      </div>
      <section>${ pageToRender }</section>
    </main>
    <footer>
      <span class="fr">Powered by <a href="{{package.json:homepage}}" title="Version: {{package.json:version}}" target="_blank" rel="noopener noreferrer">{{package.json:title}}</a></span>
    </footer>
    <div class=notis>
      ${Object.values(notis)}
    </div>
  </body>`;

  function createNewPage(e) {
    e.preventDefault();
    const title = e.currentTarget.np.value.trim();
    if (title.length < 2) return alert('Enter more than 1 character to create a new page.');
    emit(events.CREATE_PAGE, title.trim());
  }

  function toggleSidebar() {
    state.sb = !state.sb;
    emit(events.RENDER);
  }

  function changeTab(e) {
    state.sbTab = e.target.innerText;
    emit(events.RENDER);
  }
};
