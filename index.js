import choo from 'choo';
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

export default (() => {
	// Populate window with dependencies and helpers before starting app
	window.html = require('choo/html');
	if (process.env.EDITOR !== 'md') {
		window.pell = require('pell');
	}
	if (process.env.EDITOR !== 'html') {
		window.md = require('./helpers/snarkdownEnhanced').default;
	}
	window.FW = {
		slugify,
		date: formatDate,
		tidy: tidyArray,
		extract: extractFeatherWikiData,
		gen: generateWikiHtml,
		img,
		hash,
		inject,
		json,
		upload: uploadFile,
	};
	
	const app = choo({ hash: true });
	// Reminder: outlinks require `target="_blank"` *and* `rel="noopener noreferrer"`

	if (process.env.NODE_ENV !== 'production') {
		app.use(require('choo-devtools')());
	}

	app.use(initState);
	app.use(initEmitter);
	app.use(state => addEventListener('beforeunload', event => {
		if (state.changed) {
			event.preventDefault();
			return event.returnValue = "Lose unsaved changes?";
		}
	}, { capture: true }));
	app.route('/:p', globalView);
	app.mount('body');
	window.choo = app;
})();
