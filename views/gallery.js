import html from 'choo/html';

export const gallery = (state, emit, options = {}) => {
  const { events, root } = state;
  const {
    showDelete = false,
    showUsed = false,
    insert = null,
  } = options;
  const images = getImageDetails();

  return html`<section>
      <h1>Existing Images</h1>
      ${
        images.map(i => html`<div class="ib at ed w14">
          <div class=g>
            <img src=${i.img} class=w1 aria-describedby=alt />
            <span id=alt class=db>${i.alt} (${i.size[0]}x${i.size[1]}px)</span>
            <div class=pb>
              <button onclick=${e => viewImage(e, i.img)}>View</button>
              ${showDelete ? html`<button onclick=${e => editAlt(e, i)}>Edit Alt</button>` : ''}
              ${showDelete ? html`<button class=del onclick=${e => deleteImage(e, i)}>Delete</button>` : ''}
              ${insert ? html`<button onclick=${e => insert(e, i)}>Insert</button>` : ''}
            </div>
            ${
              showUsed
              ? [
                html`<details>
                  <summary>Used in ${i.pgs.length} pages</summary>
                  <ul>
                    ${ i.pgs.map(pg => html`<li><a href="${root}?page=${pg.slug}">${pg.name}</a></li>`) }
                  </ul>
                </details>`
              ] : ''
            }
          </div>
        </div>`)
      }
    </article>
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

  function viewImage(e, img) {
    e.preventDefault();
    var image = new Image();
    image.src = img;

    var w = window.open('');
    w.document.write(image.outerHTML);
  }

  function editAlt(e, i) {
    e.preventDefault();
    state.p.img[i.id].alt = prompt('Set alt text', i.alt);
    emit(events.CHECK_CHANGED);
  }

  function deleteImage(e, i) {
    e.preventDefault();
    if (!confirm('Permanently delete image from all pages in wiki?')) return false;
    delete state.p.img[i.id];
    if (i.pgs.length > 0) {
      state.p.pages = state.p.pages.map(pg => {
        if (pg.content) {
          pg.content = pg.content.replaceAll(`<img src="img:${i.id}:img">`, '');
        }
        return pg;
      });
    }
    emit(events.CHECK_CHANGED);
  }
}