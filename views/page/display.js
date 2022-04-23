import html from 'choo/html';
import raw from 'choo/html/raw';
import { injectImageById, injectPageLink, injectTargetBlank } from '../../helpers/injection';

export const pageDisplay = (state, emit, page) => {
  const { content } = page;
  let c = injectTargetBlank(content);
  c = injectPageLink(c, state);
  c = injectImageById(c, state);
  return [
    html`<article class=uc>
      ${ c ? raw(c) : 'No Page Content' }
    </article>`,
    html`<footer class=r>
      <dl class="c w34 r">
        <dt class=c><b>Tagged:</b></dt>
        <dd class=c>
          ${
            page?.tags
            ? page.tags.replace(/,/g, ', ')
            : ''
          }
        </dd>
      </dl>
      ${
        page.id
        ? html`<div class="c w14 tr">
          <button onclick=${() => emit(state.events.START_EDIT)}>Edit</button>
        </div>`
        : ''
      }
    </footer>`
  ];
}