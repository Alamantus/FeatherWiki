/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// Ez a kiterjesztés letölti az aktuális Feather Wiki legfrissebb verziójának másolatát a https://feather.wiki oldalról, ellenőrzi a verziószámot,
// és megjeleníti a „A Feather Wiki frissítése a(z) X.X.X.X verzióra” gombot a Beállítások oldalon az aktuális Feather Wiki verzió alatt, ha a legújabb verzió
// újabb, mint az aktuális verzió. Ha a Warblert használjuk, és a szerverre mentés elérhető, akkor erre a gombra kattintva a frissített fájl a szerverre kerül,
// felülírva a meglévő fájlt. Ellenkező esetben a frissített fájl letöltése elindul.
// Kérjük, csak akkor használja ezt a kiterjesztést, ha frissítést keres, és kérjük, távolítsa el, ha végzett!
FW.ready(() => {
  const { state, emitter } = FW;
  console.log('Az upgrade-feather-wiki.js futtatása');
  const { events } = state;
  const version = document.head.getElementsByTagName('meta').namedItem('version')?.content?.split('_');
  ['DOMContentLoaded', 'render'].forEach(ev => {
    emitter.on(ev, () => {
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        renderUpgradeButtonSection();
      }, 50);
    });
  });
  emitter.emit('DOMContentLoaded');

  async function renderUpgradeButtonSection () {
    // Don't run if not on settings page or if already rendered
    if (state.query.page !== 's' || !!document.querySelector('#upgradeButtonSection')) return;
    const showButton = await needsUpgrade();
    if (!showButton) return;

    const section = html`<p id="upgradeButtonSection" style="margin-top:20px;">
      <button onclick=${() => saveUpgradedHtml()}>Frissítés a Feather Wiki ${state.upgradeToVersion} verziójára</button>
    </p>`;
    document.querySelector('article.mw>div.tr').appendChild(section);
  }

  async function needsUpgrade() {
    const current = version[1] ?? version[0];
    let latest = state.upgradeToVersion;
    if (!latest) {
      state.upgradeHtml = await getUpgradedHtml();
      if (!state.upgradeHtml) return false;
      const doc = document.implementation.createHTMLDocument();
      doc.write(state.upgradeHtml);
      state.upgradeToVersion = doc.getElementsByTagName('meta').namedItem('version')?.content;
      latest = state.upgradeToVersion;
    }
    cParts = current.split('.');
    lParts = latest.split('.');
    for (let i = 0; i < lParts.length; i++) {
      if (typeof cParts[i] === 'undefined') return true;
      const c = parseInt(cParts[i])
        l = parseInt(lParts[i]);
      if (c < l) {
        return true; // If any part from left to right has a lower version, it needs an upgrade
      }
      if (c > l) return false; // If any part from left to right has a higher version, it does not
    }
    return false;
  }

  async function getUpgradedHtml() {
    const upgrade = await fetch('https://feather.wiki/builds/FeatherWiki.html').then(r => r.text()).then(h => {
	  	const { c, p, j } = state;
	    const static = FW.gen(state).replace(new RegExp(`.*<body> (.*?) <${j ? 'script' : '/body'}.*`, 's'), '$1');
      // Try to match the most specific pieces of HTML possible
	    return h.replace(
	      '<title>Feather Wiki</title> <meta name=description content="A lightweight quine for simple, self-contained wikis">',
	      `<title>${p.name}</title> ${p.desc ? `<meta name=description content="${p.desc.replace(/"/g, '\\"')}">` : ''}`
	    ).replace(
	      '<script id=p type=application/json>{}<\/script>',
	      `${c ? `<style id=c>${c}<\/style> ` : ''}<script id=p type=application/json>${JSON.stringify(FW.json.compress(p))}<\/script>`
	    ).replace(
	      '<\/script> <\/head> <body>',
	      `<\/script> ${FW.inject.esc(p.head, true)} <\/head> <body>`
	    ).replace(
	      /<body> <a href="?https:\/\/src.feather.wiki\/#versions"?>JavaScript<\/a> is required /,
	      `<body> ${static} ${j ? `<script id=j>${j}<\/script> ` : ''}`
	    );
	  });
    if (!upgrade) {
      emitter.emit(events.NOTIFY, `A frissítés sikertelen! Nem lehet ellenőrizni a legfrissebb verziót`, 9999, 'background:#e88');
      return null;
    }
    return upgrade;
  }

  function saveUpgradedHtml() {
    if (!state.upgradeHtml) return emitter.emit(events.NOTIFY, `A frissítés sikertelen! Nem lehet letölteni a legújabb verziót.`, 9999, 'background:#e88');
    if (state.canSave && !confirm('Ez megpróbálja beilleszteni a jelenlegi wiki\ adatait a legújabb verzióba és felülírja a kiszolgálón található fájlt.\n\n\nKérjük, mentse el a wiki egy példányát, mielőtt folytatja!\n\n\nFolytatja?')) return;
    const { root } = state;
    if (state.canSave) {
      fetch(root, { method: 'PUT', body: state.upgradeHtml })
        .then(resp => resp.text()
          .then(text => ({ ok: resp.ok, status: resp.status, text: text }))
        )
        .then(result => {
          if (!result.ok) throw result.text ? result.text : `Status ${result.status}.`
          alert('Frissítve. Az oldal újból betöltődik.');
          window.location.reload();
        })
        .catch(err => {
          emitter.emit(events.NOTIFY, `A frissítés sikertelen! ${err}`, 9999, 'background:#e88');
        });
    } else {
      const filename = /\/$/.test(root) ? 'index.html' : root.substring(root.lastIndexOf('/') + 1);
      const el = document.createElement('a');
      el.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(state.upgradeHtml));
      el.setAttribute('download', filename);
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
    }
  }
});
