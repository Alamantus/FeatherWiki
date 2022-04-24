import html from 'choo/html';

export const settingsView = (state, emit) => {
  const { events, p } = state;
  return html`<section>
    <header>
      <h1>Wiki Settings</h1>
    </header>
    <article>
      <form onsubmit=${saveSettings}>
        <div class=r>
          <label class="c tr w14" for=wTitle>Wiki Title</label>
          <div class="c w34">
            <input class=w1 id=wTitle value=${p.name} minlength=1 required>
          </div>
        </div>
        <div class=r>
          <label class="c tr w14" for=wDesc>Wiki Description</label>
          <div class="c w34">
            <input class=w1 id=wDesc value=${p.desc}>
          </div>
        </div>
        <div class=r>
          <label class="c tr w14" for=wPub>Publish</label>
          <div class="c w34">
            <input id=wPub type=checkbox checked=${p.published ?? false}>
            <span class=h>Hides Save, New Page, & Wiki Settings buttons. You will need to manually visit <code>?page=s</code> to unset this when set.</span>
          </div>
        </div>
        <div class=tr>
          <button type="submit">Update</button>
        </div>
      </form>
    </article>
  </section>`;

  function saveSettings(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = form.wTitle.value.trim();
    if (title.length < 1) return alert('Title is required');
    state.p.name = title;
    state.p.desc = form.wDesc.value.trim();
    state.p.published = form.wPub.checked;
    emit(events.CHECK_CHANGED);
  }
}