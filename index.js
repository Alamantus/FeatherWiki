/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
import Choo from './nanochoo';
import { initState } from './initState';
import { initEmitter } from './initEmitter';
import { globalView } from './views/global';

import xtr from './helpers/extractFeatherWikiData';
import gen from './helpers/generateWikiHtml';
import * as img from './helpers/handleImage';
import * as hash from './helpers/hashString';
import * as inject from './helpers/injection';
import * as json from './helpers/jsonCompress';

// Populate window with dependencies and helpers before starting app
window.html = require('nanohtml');
html.raw = require('nanohtml/raw');
window.ed = require('./helpers/ed').default;
window.md = require('./helpers/md').default;

// Reminder: outlinks require `target="_blank"` *and* `rel="noopener noreferrer"`
window.FW = Choo();
// Replace whitespace with _ then all ASCII punctuation (except _) & non-print characters with -
// Only ASCII ranges are replaced to allow non-English characters to be used
FW.slug = s => s?.toLowerCase().replace(/\s/g, '_').replace(/[\x00-\x2F\x3A-\x40[\\\]^`\x7B-\x7F]/g, '-');
FW.date = d => d.toLocaleString();
// For arrays of strings (like tags) only
FW.tidy = ar => ar.map(v => v.trim()).filter((v, i, a) => v.length && a.indexOf(v) === i).sort();
FW.xtr = xtr;
FW.gen = gen;
FW.img = img;
FW.hash = hash;
FW.inject = inject;
FW.json = json;
FW.upload = (mime, cb) => {
  const input = html`<input type="file" accept=${mime} onchange=${e => {
    const f = e.target.files;
    if (f.length > 0) cb(f[0]);
  }} />`;
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
};

FW.ready(() => {
	initState(FW.state);
	initEmitter(FW.state, FW.emitter);
});
FW._view = globalView;
FW.mount('body');

window.addEventListener('beforeunload', event => {
	if (FW.state.changed) {
		event.preventDefault();
		return event.returnValue = "Lose unsaved changes?";
	}
}, { capture: true });
