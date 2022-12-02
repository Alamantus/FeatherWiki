/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
// This extension adds a "Data Management" section to the Wiki settings page that allows you to import multiple HTML, Markdown, and plain text files as new pages in your wiki and
// export all of your current wiki's pages as HTML or Markdown files. It loads JSZip from a CDN when exporting to package up all the pages into a single .zip file.
// You can also export your entire wiki's raw JSON data in its uncompressed format, but this may be less useful to you if you don't know how to manipulate JSON data.
(function importExportExtension () {
  if (!window.FW._loaded) return setTimeout(importExportExtension, 1); // wait until FW is mounted
  const { state, emitter } = window.FW;
  console.log('running importExportExtension');

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
            emitter.emit(state.events.NOTIFY, 'Import complete. Don\'t forget to save your wiki!');
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
        const download = html`<a href="data:application/zip;base64,${base64}" download="${window.FW.slug(state.p.name)}_pages.zip">Download pages</a>`;
        document.body.appendChild(download);
        download.click();
        document.body.removeChild(download);
      });
    },
    exportJson: () => {
      const download = html`<a href="data:application/json;base64,${btoa(JSON.stringify(state.p))}" download="${window.FW.slug(state.p.name)}.json">Download JSON data</a>`;
      document.body.appendChild(download);
      download.click();
      document.body.removeChild(download);
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
      <h1>Data Management</h1>
      <div class="r">
        <div class="c w12">
          <button onclick=${() => window.FW.data.import()} style="margin-right:10px;">Import Files as Pages</button>
          <p class="h">Select 1 or more HTML, Markdown, and plain text files to import as pages.</p>
          <p class="h">If HTML files have a <code>title</code> tag in the <code>head</code> OR a <code>H1</code> tag, the text will be used as the title, otherwise the file name without the extension will be used.</p>
          <p class="h">If Markdown files have YAML frontmatter, the <code>name</code> or <code>title</code> field will be used as the title and <code>tags</code> will be used as tags. Otherwise the first <code>#</code> heading level will be used, and if there is none, the file name without the extension.</p>
          <p class="h">The importer will do its best to parse the content and file type, but it is likely that various use cases may be missed. The simpler your files, the better your results will likely be.</p>
        </div>
        <div class="c w12">
          <button onclick=${() => window.FW.data.export()}>Export Pages</button>
          <p class="h">Collects all pages in the wiki into a <code>.zip</code> file with filenames matching their slug. The page name is added as a <code>H1</code> heading to the top of the file, and any tags are included below the page name.</p>
          <p class="h">Parent/child relationships are <em>not</em> preserved when exporting using this extension, and any internal images are injected into the content of the page. Likewise, internal links are transformed into regular HTML links linking to the output file.</p>
          <p class="h">Note: Content on the Wiki Settings page is not included in the export.</p>
          <button onclick=${() => window.FW.data.exportJson()}>Export Raw JSON Data</button>
        </div>
      </div>
    </section>`;
    const page = document.querySelector('article.mw');
    page.appendChild(section);
  }
})();
