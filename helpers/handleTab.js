/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
/* This handleTab function has been modified from https://github.com/fregante/indent-textarea, which is provided under an MIT license: https://github.com/fregante/indent-textarea/blob/main/license */
/* Use handleTab as the `onkeydown` listener on a textarea element to enable indenting & dedenting. */
 export function handleTab (e) {
  if (e.key === 'Tab') {
    const s = this;
    const insert = (text) => {
      var initialFocus = document.activeElement;
      if (initialFocus !== s) s.focus();
      const safeInsert = text === '' ? document.execCommand('delete') : document.execCommand('insertText', false, text);
      if (!safeInsert) {
        s.setRangeText(text, s.selectionStart || 0, s.selectionEnd || 0, 'end');
        s.dispatchEvent(new InputEvent('input', { text, inputType: 'insertText' }));
      }
    }
    const { selectionStart, selectionEnd, value } = s;
    const firstLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    if (e.shiftKey) {
      const lastLineStart = value.lastIndexOf('\n', selectionEnd - 1) + 1;
      const minimumSelectionEnd = value.charAt(lastLineStart) !== '\t' ? selectionEnd : lastLineStart + 1
      const newSelection = s.value.slice(firstLineStart, minimumSelectionEnd);
      const indentedText = newSelection.replace(/(^|\n)(\t| {1,2})/g, '$1');
      const replacementsCount = newSelection.length - indentedText.length;
      s.setSelectionRange(firstLineStart, minimumSelectionEnd);
      insert(indentedText);
      const firstLineIndentation = /\t| {1,2}/.exec(value.slice(firstLineStart, selectionStart));
      const difference = firstLineIndentation
          ? firstLineIndentation[0].length
          : 0;
      const newSelectionStart = selectionStart - difference;
      s.setSelectionRange(selectionStart - difference, Math.max(newSelectionStart, selectionEnd - replacementsCount));
    } else {
      let a;
      const selectedText = value.slice(selectionStart, selectionEnd);
      const lineBreakCount = (a = /\n/g.exec(selectedText)) === null || a === void 0 ? void 0 : a.length;
      if (lineBreakCount > 0) {
          const newSelection = s.value.slice(firstLineStart, selectionEnd - 1);
          const indentedText = newSelection.replace(/^|\n/g, '$&\t');
          const replacementsCount = indentedText.length - newSelection.length;
          s.setSelectionRange(firstLineStart, selectionEnd - 1);
          insert(indentedText);
          s.setSelectionRange(selectionStart + 1, selectionEnd + replacementsCount);
      } else {
          insert('\t');
      }
    }
    e.preventDefault();
  }
}
