/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
 import md from 'snarkdown';

export default function snarkdownEnhanced(markdown) {
  const a = '\uFFFF', u = '\uFFFE', l = '\uFFFD', r = '\uFFFC';
  // Find any HTML tags with underscore or asterisk or internal wiki links
  (markdown.match(/<.*?[_*].*?(?=>)|\[\[.+?\]\]/gs) ?? []).forEach(m => {
    markdown = markdown.replace(
      m,
      m.replace(/_/g, u)
        .replace(/\*/g, a)
        .replace(/\[\[/g, l)
        .replace(/\]\]/g, r)
    );
  });
  let c = false, b = '```'; // code block
  const s = h => h.replace(/</g, '&lt;').replace(/>/g, '&gt;'); // oversimplified HTML sanitizer
  return markdown.split(/(?:\r?\n){2,}/)
    .map(l => {
      const lt = l.trim();
      if (l.includes(b)) {
        // Parse paragraph as a code block if it contains ```
        const o = s(l) // Sanitize any HTML tags
          .replace(b, `<${c ? '/' : ''}pre>`) // Change first instance of ``` to a pre tag. If we're in a code block, assume it's the end
          .replace(b, '</pre>'); // If any ``` remain, assume it's the end.
        c = !lt.endsWith(b) || (!c && lt === b);
        return o;
      }
      if (!c && lt.match(/^[-*]{2,}$/)) return '<hr>';
      return c ? s(l) : ( // If we're in a code block, don't transform the text until we're out of it again.
        [" ", "\t", "#", "-", "*", ">"].some(c => l.startsWith(c))
        ? md(l)
        : `<p>${md(l)}</p>`
      );
    })
    .join("\n")
    .replace(new RegExp(u, 'g'), '_')
    .replace(new RegExp(a, 'g'), '*')
    .replace(new RegExp(l, 'g'), '[[')
    .replace(new RegExp(r, 'g'), ']]');
}