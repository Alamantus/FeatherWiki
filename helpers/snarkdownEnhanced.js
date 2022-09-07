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
  (markdown.match(/<[^>]*?[_*].*?(?=>)|\[\[.+?\]\]/gs) ?? []).forEach(m => {
    markdown = markdown.replace(
      m,
      m.replace(/_/g, u)
        .replace(/\*/g, a)
        .replace(/\[\[/g, l)
        .replace(/\]\]/g, r)
    );
  });
  const s = h => h.replace(/</g, '&lt;').replace(/>/g, '&gt;'); // oversimplified HTML sanitizer
  return markdown.split('```')
    .map((b, i) => {
      // Every odd instance of the split will be the code
      return i % 2 == 1 ? `<pre>${s(b)}</pre>` : (
        b.split(/(\r?\n){2,}/)
          .map(l => {
            const lt = l.trim();
            return [" ", "\t", "#", "-", "*", ">"].some(c => l.startsWith(c))
              ? md(l) // If the line starts with a markdown character, parse it directly
              : lt == '' ? lt : ( // If the trimmed line is empty, return the empty line
                lt.match(/^[-*]{3,}$/) ? '<hr>' : `<p>${md(l)}</p>` // If it's 3 or more - or *, insert horizontal rule, otherwise wrap it in a paragraph tag.
              );
          }).join('')
      )
    }).join('')
    .replace(new RegExp(u, 'g'), '_')
    .replace(new RegExp(a, 'g'), '*')
    .replace(new RegExp(l, 'g'), '[[')
    .replace(new RegExp(r, 'g'), ']]');
}