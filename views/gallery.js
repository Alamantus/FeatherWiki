import html from 'choo/html';

export const gallery = (state, emit, options = {}) => {
  const { events, siteRoot } = state;
  const {
    showDelete = false,
    showUsed = false,
  } = options;
  const images = getImageDetails();

  return html`<section>
      <h1>Existing Images</h1>
      ${
        images.map(i => html`<div class="ib at pell w14">
          <div class=editor>
            <img src=${i.img} class=w1 /><br />
            <button onclick=${() => viewImage(i.img)}>👁</button>
            ${showDelete ? html`<button onclick=${() => deleteImage(i)}>❌</button>` : ''}
            ${
              showUsed
              ? [
                html`<details>
                  <summary>Used in ${i.pgs.length} pages</summary>
                  <ul>
                    ${ i.pgs.map(pg => html`<li><a href="${siteRoot}?page=${pg.slug}">${pg.name}</a></li>`) }
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
        img: img[id],
        pgs: showUsed ? pages.filter(pg => {
          return pg.content?.includes(`img:${id}:img`);
        }) : [],
      };
    });
  }

  function viewImage(img) {
    var image = new Image();
    image.src = img;

    var w = window.open('');
    w.document.write(image.outerHTML);
  }

  function deleteImage(i) {
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