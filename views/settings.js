import html from 'choo/html';

export const settingsView = (state, emit) => {
  const { events, p } = state;
  return html`<form onsubmit=${saveSettings}>
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
    <div class=tr>
      <button type="submit">Update</button>
    </div>
  </form>`;

  function saveSettings(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = form.wTitle.value.trim();
    if (title.length < 1) return alert('Title is required');
    state.p.name = title;
    state.p.desc = form.wDesc.value.trim();
    emit(events.CHECK_CHANGED);
  }
}