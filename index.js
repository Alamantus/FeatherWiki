import Choo from 'choo';
import { initState } from './initState';
import { initEmitter } from './initEmitter';
import { globalView } from './views/global';

import { slugify, formatDate, tidyArray } from './helpers/formatting';
import { extractFeatherWikiData } from './helpers/extractFeatherWikiData';
import { generateWikiHtml } from './helpers/generateWikiHtml';
import * as img from './helpers/handleImage';
import * as hash from './helpers/hashString';
import * as inject from './helpers/injection';
import * as json from './helpers/jsonCompress';
import { uploadFile } from './helpers/uploadFile';

// Populate window with dependencies and helpers before starting app
window.html = require('choo/html');
html.raw = require('choo/html/raw');
if (process.env.EDITOR !== 'md') {
	window.pell = require('pell');
}
if (process.env.EDITOR !== 'html') {
	window.md = require('./helpers/snarkdownEnhanced').default;
}

window.FW = Choo({ hash: true });
// Reminder: outlinks require `target="_blank"` *and* `rel="noopener noreferrer"`
FW.slug = slugify;
FW.date = formatDate;
FW.tidy = tidyArray;
FW.xtr = extractFeatherWikiData;
FW.gen = generateWikiHtml;
FW.img = img;
FW.hash = hash;
FW.inject = inject;
FW.json = json;
FW.upload = uploadFile;

if (process.env.NODE_ENV !== 'production') {
	FW.use(require('choo-devtools')());
}

FW.use(initState);
FW.use(initEmitter);
FW.use(state => addEventListener('beforeunload', event => {
	if (state.changed) {
		event.preventDefault();
		return event.returnValue = "Lose unsaved changes?";
	}
}, { capture: true }));
FW.route('/:p', globalView);
FW.mount('body');
window.choo = FW; // Don't break 1.3.0 extensions
