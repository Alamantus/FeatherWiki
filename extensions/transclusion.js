// This extension finds any content between double braces {{like_this}} and looks for a page with a matching
// slug. If found, the braced content will be replaced with the content of the target page within an `article`
// tag with a class of `transclusion` so it can be targeted and styled.
if (!window.FW._loaded) window.FW.use(transclusionExtension);
else (({state, emitter}) => transclusionExtension(state, emitter))(window.FW);

function transclusionExtension (state, emitter) {
  const { events } = state;
  state.tDepth = 0;
  state.tDepthMax = 20; // Maximum depth to check for transclusion
  [events.DOMCONTENTLOADED, events.RENDER].forEach(ev => {
    emitter.on(ev, () => {
      state.tDepth = 0;
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        injectTransclusion();
      }, 300);
    });
  });
  if (window.FW._loaded) emitter.emit(state.events.DOMCONTENTLOADED);

  function injectTransclusion() {
    if (state.pg) {
      const uc = document.querySelector('.uc');
      const matches = uc?.innerHTML?.match(/{{.+?(?=}})/g) ?? [];
      matches.forEach(l => {
        const slug = l.replace('{{', '').trim();
        const page = state.p.pages.find(pg => pg.slug === slug);
        console.log(slug, page);
        if (!page) return;
        const { img, pg, out, hLink } = FW.inject;
        const pageContent = img(
          pg(
            hLink(
              out(`<h1 id=${page.slug}>${page.name} <a internal href="?page=${page.slug}" class="fr h">Go to Page</a></h1>${page.content}`)
            ),
            state
          ),
          state
        );
        uc.innerHTML = uc.innerHTML.replace(
          `${l}}}`,
          `<article class="transclusion">${pageContent}</article>`
        );
      });
      if (matches.length > 0 && state.tDepth < state.tDepthMax) {
        state.tDepth++;
        // If transclusion is injected, run again to see if more is needed
        // Only run it state.tDepthMax times to prevent potential infinite recursion
        injectTransclusion();
      }
    }
  }
}
