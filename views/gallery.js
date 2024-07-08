/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
export const gallery = (state, emit, options = {}) => {
  const { events } = state;
  const {
    showDelete = false,
    showUsed = false,
    insert = null,
  } = options;
  const images = getImageDetails();

  return html`<section>
    <h1>{{translate:embeddedImagesHeading}}</h1>
    ${
      images.map(i => html`<div class="ib at ed w14">
        <div class=g>
          <img src=${i.img} class=w1 aria-describedby="${i.id}_alt" />
          <span id="${i.id}_alt" class=db>${i.alt} (${i.size[0]}x${i.size[1]}px)</span>
          <div class=pb>
            <button type="button" onclick=${e => viewImage(i.img)}>{{translate:viewImageButton}}</button>
            ${showDelete ? html`<button type="button" onclick=${e => editAlt(i)}>{{translate:editAltTextButton}}</button>` : ''}
            ${showDelete ? html`<button type="button" class=del onclick=${e => deleteImage(i)}>{{translate:deleteImageButton}}</button>` : ''}
            ${insert ? html`<button type="button" onclick=${e => insert(e, i)}>{{translate:insertImageButton}}</button>` : ''}
          </div>
          ${
            showUsed
            ? [
              html`<details>
                <summary class=b>{{translate:imageUsedIn}}</summary>
                <ul>
                  ${ i.pgs.map(pg => html`<li><a href="?page=${pg.slug}">${pg.name}</a></li>`) }
                </ul>
              </details>`
            ] : ''
          }
        </div>
      </div>`)
    }
  </section>`;

  function getImageDetails() {
    const { pages, img } = state.p;
    return Object.keys(img).map(id => {
      return {
        id,
        ...img[id],
        pgs: showUsed ? pages.filter(pg => {
          return pg.content?.includes(`img:${id}:img`);
        }) : [],
      };
    });
  }

  function viewImage(i) {
    var img = new Image();
    img.src = i;

    var w = window.open('');
    w.document.write(img.outerHTML);
  }

  function editAlt(i) {
    state.p.img[i.id].alt = prompt('{{translate:imageAltTextPrompt}}', i.alt) ?? i.alt;
    emit(events.CHECK_CHANGED);
  }

  function deleteImage(i) {
    if (!confirm('{{translate:deleteImagePrompt}}')) return false;
    delete state.p.img[i.id];
    if (i.pgs.length > 0) {
      state.p.pages = state.p.pages.map(pg => {
        if (pg.content) {
          pg.content = pg.content.replaceAll(`img:${i.id}:img`, 'deleted');
        }
        return pg;
      });
    }
    emit(events.CHECK_CHANGED);
  }
}

export const modal = (state, insert) => {
  return html`<dialog id=g>
    <form class=fr method=dialog>
      <button>{{translate:closeButton}}</button>
    </form>
    ${ gallery(state, () => {}, { insert: (e, i) => FW.img.put(e, i, insert) }) }
  </dialog>`;
}
