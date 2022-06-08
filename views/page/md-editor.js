import { gallery } from '../gallery';

export const editor = (state) => {
  const textChange = event => state.edits.content = event.target.value;
  const element = html`<textarea onchange=${textChange}>${state.edits.content}</textarea>`;

  return [
    element,
    html`<button onclick=${e => {e.preventDefault(); FW.img.upload(state, insert)}}>Insert Image from File</button>`,
    html`<button onclick=${e => {e.preventDefault(); document.getElementById('g').showModal()}}>Add Existing Image</button>`,
    html`<dialog id=g>
      <form class=fr method=dialog>
        <button>Close</button>
      </form>
      ${ gallery(state, () => {}, { insert: (e, i) => FW.img.put(e, i, insert) }) }
    </dialog>`,
  ];
  
  // Modified from https://stackoverflow.com/a/19961519
  function insert ({ id }) {
    const text = `![](img:${id}:img)`;
    if (document.activeElement !== element) element.focus();
    if (document.selection) {
      // IE
      const sel = document.selection.createRange();
      sel.text = text;
    } else if (element.selectionStart || element.selectionStart === 0) {
      // Others
      var startPos = element.selectionStart;
      var endPos = element.selectionEnd;
      element.value = element.value.substring(0, startPos) +
        text +
        element.value.substring(endPos, element.value.length);
      element.selectionStart = startPos + text.length;
      element.selectionEnd = startPos + text.length;
    } else {
      element.value += text;
    }
    textChange({ target: element });
  };
}
