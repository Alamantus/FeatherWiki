import html from 'choo/html';
import raw from 'choo/html/raw';

export const pageDisplay = (state, emit, page) => {
  return [
    html`<article>
      ${
        page?.content
        ? raw(page.content)
        : 'No Page Content'
      }
    </article>`,
    html`<footer class=r>
      <div class="c w34">
        ${
          page?.tags
          ? page.tags.join(', ')
          : ''
        }
      </div>
      <div class="c w14 tr">
        <button onclick=${() => emit(state.events.START_EDIT)}>Edit</button>
      </div>
    </footer>`
  ];
}