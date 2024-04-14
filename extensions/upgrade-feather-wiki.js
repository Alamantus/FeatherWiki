/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension downloads a copy of the most recent version of the current Feather Wiki's build from https://feather.wiki, checks the version number,
// and displays an "Upgrade to Feather Wiki version X.X.X" button on the Settings page below the current Feather Wiki version if the latest version
// is newer than the current version. If using Warbler and server saving is available, clicking this button will save the upgraded file to the server,
// overwriting the existing file. Otherwise, it will prompt for a download of the upgraded file.
// Please only use this extension when checking for an upgrade, and please remove it when you're done!
(function upgradeFeatherWikiExtension () {
  if (!window.FW._loaded) return setTimeout(upgradeFeatherWikiExtension, 1);
  console.log('running upgradeFeatherWikiExtension');
  const { state, emitter } = window.FW;
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
      <button onclick=${() => saveUpgradedHtml()}>Upgrade to Feather Wiki version ${state.upgradeToVersion}</button>
    </p>`;
    document.querySelector('article.mw>div.tr').appendChild(section);
  }

  async function needsUpgrade() {
    const current = version[1];
    let latest = state.upgradeToVersion;
    if (!latest) {
      state.upgradeHtml = await getUpgradedHtml();
      if (!state.upgradeHtml) return false;
      const doc = document.implementation.createHTMLDocument();
      doc.write(state.upgradeHtml);
      state.upgradeToVersion = doc.getElementsByTagName('meta').namedItem('version')?.content?.split('_')[1];
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
    const upgrade = await fetch(`https://feather.wiki/builds/FeatherWiki_${version[0]}.html`).then(r => r.text()).then(h => {
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
      emitter.emit(events.NOTIFY, `Upgrade failed! Couldn't get new version.`, 9999, 'background:#e88');
      return null;
    }
    return upgrade;
  }

  function saveUpgradedHtml() {
    if (!state.upgradeHtml) return emitter.emit(events.NOTIFY, `Upgrade failed! Couldn't get new version.`, 9999, 'background:#e88');
    if ((state.canPut || state.canSave) && !confirm('This attempts to insert the current wiki\'s data into the newest version & save over the file on the server.\n\nPlease save a copy of your wiki before continuing!\n\nContinue?')) return;
    const { root } = state;
    if ((state.canPut || state.canSave)) {
      fetch(root, { method: 'PUT', body: state.upgradeHtml })
        .then(resp => resp.text()
          .then(text => ({ ok: resp.ok, status: resp.status, text: text }))
        )
        .then(result => {
          if (!result.ok) throw result.text ? result.text : `Status ${result.status}.`
          alert('Upgraded. Page will now reload.');
          window.location.reload();
        })
        .catch(err => {
          emitter.emit(events.NOTIFY, `Upgrade failed! ${err}`, 9999, 'background:#e88');
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
})();
