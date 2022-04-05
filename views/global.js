import html from 'choo/html';

export const globalView = (state, emit) => {
  const siteRoot = state.href.substring(state.href.lastIndexOf('/'));
  const { pageSlug } = state.params.pageSlug;
  const page = state.p.entries.find(p => p.slug === pageSlug);
  
  return html`<body>
    <header>
      <a href=${siteRoot} class="title">${state.p.title}</a>
      <span class="fr"><button title="Download wiki in its current state" onclick=${() => emit('save')}>Save</button></span>
    </header>
    <main>
      <nav class="sb" hidden=${!state.showSidebar}></nav>
      <section>
        <header><h1>${page?.title ?? 'Welcome!'}</h1></header>
      </section>
    </main>
    <footer>
      <span class="fr">Powered by <a href="https://codeberg.org/Alamantus/FeatherWiki" target="_blank" rel="noopener noreferrer">FeatherWiki</a></span>
    </footer>
  </body>`;
};
