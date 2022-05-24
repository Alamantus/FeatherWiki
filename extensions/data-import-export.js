// This is a basic example that throws import/export buttons to the Wiki Settings page and an export button each edit page. 
// Since I don't know what specific use cases you might have for importing and exporting specific data, please feel free
// to submit expanded/improved versions of this Feather Wiki extension.
choo.use((state, emitter) => {
  emitter.on(state.events.RENDER, () => {
    setTimeout(() => {
      if (state.query.page === 's') {
        const wikiImport = document.querySelector('.del');
        if (wikiImport) {
          if (!document.querySelector('#importButton')) {
            wikiImport.parentNode.appendChild(createImportButton());
          }
          if (!document.querySelector('#exportWikiData')) {
            wikiImport.parentNode.appendChild(createExportWikiDataButton());
          }
        } 
      }
      if (state.query.page && state.query.page.length > 1 && state.edit) {
        if (!document.querySelector('#exportPage')) {
          const deleteButton = document.querySelector('.del');
          if (deleteButton) {
            deleteButton.parentNode.appendChild(createExportPageButton());
          }
        }
      }
    }, 500);
  });

  function createImportButton () {
    const button = html`<button id=importButton onclick=${e => importClick(e)}>Import Page</button>`;
    function importClick (e) {
      e.preventDefault();
      uploadFile(file => {
        console.info('selected file:', file);
        const reader = new FileReader();
        reader.onload = e => {
          const content = e.target.result;
          let name = 'Imported Page';
          switch (file.type) {
            case 'text/html': {
              do {
                name = prompt('Enter a title', name);
                if (name.trim().length < 2) return alert('Title must be at least 2 characters long.');
              } while (name.trim().length < 2)
              emitter.emit(state.events.CREATE_PAGE, name);
              state.p.pages[state.p.pages.length - 1].content = content;
              break;
            }
            case 'application/json': {
              const json = JSON.parse(content);
              name = json.name ?? name;
              emitter.emit(state.events.CREATE_PAGE, name);
              const page = state.p.pages[state.p.pages.length - 1];
              page.slug = json.slug ?? page.slug;
              page.content = json.content ?? '';
              page.tags = json.tags ?? '';
              break;
            }
            default: {
              return alert('I don\'t know how to handle that file.');
            }
          }
          emitter.emit(state.events.START_EDIT);
          emitter.emit(state.events.UPDATE_PAGE, state.pg);
        };
        reader.onerror = e => {
          console.error(e);
        };
        reader.readAsText(file);
      });
    };
    return button;
  }
  
  function createExportPageButton () {
    const button = html`<button id=exportPage onclick=${e => exportPage(e)}>Export Page</button>`;
    function exportPage (e) {
      e.preventDefault();
      console.log(state);
      const filename = state.pg.slug + '.json';
      const output = {...state.pg};
      delete output.id;
      const el = document.createElement('a');
      el.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(output)));
      el.setAttribute('download', filename);
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
    };
    return button;
  }
  
  function createExportWikiDataButton () {
    const button = html`<button id=exportWikiData onclick=${e => exportWikiData(e)}>Export Wiki Data</button>`;
    function exportWikiData (e) {
      e.preventDefault();
      const filename = state.p.name + '.json';
      const el = document.createElement('a');
      el.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.p)));
      el.setAttribute('download', filename);
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
    };
    return button;
  }
  
  function uploadFile (cb) {
    const input = html`<input type=file accept="text/html,application/json" onchange=${e => {
      const { files } = e.target;
      if (files.length > 0) cb(files[0]);
    }} />`;
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }
});
