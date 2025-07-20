/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// Ez a kiegészítő egy „Adatkezelés” szekciót ad a Wiki beállítások oldalához, amely lehetővé teszi, hogy több HTML, Markdown és egyszerű szöveges fájlt importáljon új oldalaként a wikibe és
// exportálja a jelenlegi wiki összes oldalát HTML vagy Markdown fájlként. Exportáláskor egy CDN-ből tölti be a JSZip modult, hogy az összes oldalt egyetlen .zip fájlba csomagolja.
// A wiki teljes nyers JSON-adatait is exportálhatja tömörítetlen formában, de ez kevésbé hasznos lehet számára, ha nem tudja, hogyan lehet a JSON-adatokat manipulálni.
FW.ready(() => {
  const { state, emitter } = FW;
  console.log('a data-import-export.js futtatása');

  window.FW.data = {
    import: () => {
      const input = html`<input type="file" multiple accept="text/html,.md,.markdown,text/plain" onchange=${e => {
        const { files } = e.target;
        if (files.length < 1) return;
        function readFile(file, callback) {
          const reader = new FileReader();
          reader.onload = e => callback(e.target.result);
          reader.onerror = e => callback(null);
          reader.readAsText(file);
        }
        let processed = 0;
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          readFile(f, (content => {
            if (content) {
              const pg = window.FW.data['parse' + (f.type === 'text/html' ? 'Html' : 'Text')](f, content);
              pg.content = window.FW.img.fix(pg.content, true);
              state.p.pages.push(pg);
              emitter.emit(state.events.CHECK_CHANGED);
            }
            processed++;
          }));
        }
        const checkDone = setInterval(() => {
          if (processed >= files.length) {
            clearInterval(checkDone);
            emitter.emit(state.events.NOTIFY, 'Az importálás befejeződött. Ne felejtse el menteni a wikijét!');
          }
        }, 300);
      }} />`;
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    },
    parseHtml: (file, content) => {
      let name;
      if (content.includes('</head>')) {
        const headContent = content.replace(/.*?<head[^>]*?>(.*)?<\/head>.*/ims, '$1');
        const head = html`<head>${html.raw(headContent)}</head>`;
        if (head.querySelector('title')) {
          name = head.querySelector('title').innerText;
        }
      }
      const body = content.includes('</body>') ? content.replace(/.*?<body[^>]*?>(.*)?<\/body>.*/ims, '$1') : content;
      const doc = html`<body>${html.raw(body)}</body>`;
      if (!name && doc.querySelector('h1')) {
        name = doc.querySelector('h1').innerText;
      }
      const pg = window.FW.data.generatePage(name ?? file.name);
      if (pg.cd > (file.lastModified ?? (Date.now() + 1))) {
        pg.cd = file.lastModified;
      }
      pg.content = doc.innerHtml;
      return pg;
    },
    parseText: (file, content) => {
      let name, tags, headContent;
      if (content.match(/^---/) !== null) {
        headContent = content.replace(/^---\r?\n(.*)?\r?\n---.*/ms, '$1');
        if (headContent.match(/^(name|title): */im) !== null) {
          name = headContent.replace(/.*\n(?:name|title): *(.+?)\r?\n.*/ims, '$1');
        }
        if (headContent.match(/^tags: */im) !== null) {
          if (headContent.match(/^tags:\s*^- /ims) !== null) {
            tags = headContent.replace(/.*\ntags:\s*(- .+)+.*/ims, '$1').replace(/- /g, '').split('\n');
          } else {
            tagsRaw = headContent.replace(/.*\ntags: *(.+).*/ims, '$1');
            try {
              if (tagsRaw.includes('[')) {
                tags = JSON.parse(tagsRaw);
              } else {
                tags = tagsRaw.split(',');
              }
            } catch (e) {}
          }
        }
      }
      const body = headContent ? content.replace(new RegExp('---\\r?\\n' + headContent + '\\r?\\n---\\r?\\n'), '') : content;
      const doc = html`<body>${md(body)}</body>`;
      if (!name && doc.querySelector('h1')) {
        name = doc.querySelector('h1').innerText;
      }
      const pg = window.FW.data.generatePage(name ?? file.name);
      if (pg.cd > (file.lastModified ?? (Date.now() + 1))) {
        pg.cd = file.lastModified;
      }
      pg.content = body;
      pg.editor = 'md';
      if (tags) pg.tags = tags.map(t => t.trim()).filter(t => t.length).join(',');
      return pg;
    },
    generatePage: name => {
      const genId = () => {
        const s = [];
        for (let i = 0; i < 9; i++) {
          const code = Math.round(Math.random() * (126 - 32)) + 32;
          s.push(String.fromCharCode(code));
        }
        return s.join('');
      }
      let id;
      do {
        id = genId();
      }
      while (state.p.pages.findIndex(p => p.id === id) >= 0);
      // Ensure unique slug
      let d = 0,
        s = FW.slug(name),
        slug;
      do {
        slug = s + (d > 0 ? '_' + d : '');
        d++;
      }
      while (state.p.pages.some(pp => pp.slug === slug))
      return { id, name, slug, cd: Date.now() };
    },
    export: () => {
      // If JSZip hasn't been loaded yet, load it before running the export
      if (typeof JSZip === 'undefined') {
        const jszipScript = document.createElement('script');
        document.body.appendChild(jszipScript);
        jszipScript.onload = () => window.FW.data.doExport();
        jszipScript.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
      } else {
        window.FW.data.doExport();
      }
    },
    dl: (mime, b64, suffix) => {
      const download = html`<a href="data:${mime};base64,${b64}" download="${window.FW.slug(state.p.name)}${suffix}">download</a>`;
      document.body.appendChild(download);
      download.click();
      document.body.removeChild(download);
    },
    doExport: () => {
      var zip = new JSZip();
      state.p.pages.forEach(pg => {
        let filename = pg.slug;
        let content = window.FW.inject.img(window.FW.img.fix(pg.content ?? ''));
        // replace internal links
        (content?.match(/\[\[.+?(?=\]\])/g) ?? []).forEach(l => {
          const match = l.replace('[[', '').split('|');
          const slug = match[1] ? match[1].trim() : window.FW.slug(match[0]);
          const exists = state.p.pages.find(pg => pg.slug === slug);
          if (exists) {
            content = content.replace(
              `${l}]]`,
              `<a href="${slug}.${exists.editor === 'md' ? 'md' : 'html'}">${match[0]}</a>`
            );
          }
        });
        if (pg.editor === 'md') {
          filename += '.md';
          if (pg.tags) {
            content = 'Tagged: ' + pg.tags + '\n\n' + content;
          }
          content = '# ' + pg.name + '\n\n' + content;
        } else {
          filename += '.html';
          if (pg.tags) {
            content = '<p>Tagged: ' + pg.tags + '</p>\n' + content;
          }
          content = '<h1>' + pg.name + '</h1>\n' + content;
        }
        zip.file(filename, content);
      });
      zip.generateAsync({type:"base64"}).then(function (base64) {
        window.FW.data.dl('application/zip', base64, '_pages.zip');
      });
    },
    exportJson: () => {
      window.FW.data.dl('application/json', btoa(unescape(encodeURIComponent(JSON.stringify(state.p)))), '.json');
    },
    exportStaticHtml: () => {
      const css = state.c + ' main>section>header{display:none;} @media print{main>.sb{display:none;}main>section>article{page-break-after:always;}main>section>header{display:unset;}}';
      const st = { ...state, c: css, p: { ...state.p, static: true, published: true } };
      const static = FW.gen(st)
        .replace(/<script.+?<\/script>/gsm, '')
        .replace(/<\/main> <footer>.+?<\/footer>/g, '</main>')
        // Insert print-only header
        .replace('</ul></nav></div> <section>', `</ul></nav></div> <section><header><span class=db><a href=? class=t>${st.p.name}</a></span>${ st.p.desc ? `<p class=pb>${st.p.desc}</p>` : ''}<hr></header>`);
      window.FW.data.dl('text/html', btoa(unescape(encodeURIComponent(static))), '.html');
    },
  };
  ['DOMContentLoaded', 'render'].forEach(ev => {
    emitter.on(ev, () => {
      setTimeout(() => { // Adds a very small delay so it injects after render when elements exist in DOM
        renderImportExportSection();
      }, 50);
    });
  });
  emitter.emit('DOMContentLoaded');

  function renderImportExportSection () {
    // Don't run if not on settings page or if already rendered
    if (state.query.page !== 's' || !!document.querySelector('#dataManagementSection')) return;
    const section = html`<section id="dataManagementSection" style="margin-top:20px;">
      <h1>Adatkezelés</h1>
      <div class="r">
        <div class="c w12">
          <button onclick=${() => window.FW.data.import()} style="margin-right:10px;">Fájlok Importálása Oldalakként</button>
          <p class="h">Válasszon ki 1 vagy több HTML-, Markdown- és egyszerű szöveges fájlt, amelyeket oldalakként szeretne importálni.</p>
          <p class="h">Ha a HTML fájlok rendelkeznek egy <code>title</code> elemmel a <code>head</code> elemen belül, vagy egy <code>H1</code> elemet tartalmaznak, szövegük az oldal címe lesz. Egyéb esetben az oldal címe a fájl neve, kiterjesztés nélkül.</p>
          <p class="h">Ha a Markdown fájlok rendelkeznek YAML frontmatterrel, a <code>name</code> vagy a <code>title</code> mező lesz az oldal címe és a <code>tags</code> mező a címkéket határozza meg. Egyéb esetben az első <code>#</code> címsorszint (ha légezik), vagy a fájl neve kiterjesztés nélkül lesz használva.</p>
          <p class="h">Az importáló mindent megtesz a tartalom és a fájltípus elemzése érdekében, de különböző felhasználási esetek kimaradhatnak. Minél egyszerűbbek a fájlok, annál jobbak lesznek az eredmények.</p>
        </div>
        <div class="c w12">
          <button onclick=${() => window.FW.data.export()}>Oldalak Exportálása</button>
          <p class="h">Összegyűjt minden wiki oldalt egy <code>.zip</code> fájlba, az oldalakat slugjuknak megfelelően elnevezve. Az oldalak neve egy <code>H1</code> elemben lesz megadva a fájlok elején, minden létező címke ezek alatt lesz megtalálható.</p>
          <p class="h">A szülő/gyerek kapcsolatok <em>nem</em> lesznek megőrizve a kiterjesztéssel való exportáláskor, valamint minden kép az oldal tartalmába lesz beszúrva. Belső hivatkozások HTML hivatkozásokká alakulnak át, megfelelően hivatkozva a céloldal HTML fájljára.</p>
          <p class="h">Megjegyzés: az exportban a wiki beállítások oldalán megadott tartalom nem lesz elérhető.</p>
          <button onclick=${() => window.FW.data.exportJson()}>Nyers JSON Adat exportálása</button>
          <button onclick=${() => window.FW.data.exportStaticHtml()}>Statikus HTML Exportálása</button>
        </div>
      </div>
    </section>`;
    const page = document.querySelector('article.mw');
    page.appendChild(section);
  }
});
