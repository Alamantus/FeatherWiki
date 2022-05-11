import html from 'choo/html';

export function uploadFile (mime, cb) {
  const input = html`<input type="file" accept=${mime} onchange=${e => {
    const { files } = e.target;
    if (files.length > 0) cb(files[0]);
  }} />`;
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}