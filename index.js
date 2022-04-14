import choo from 'choo';
import { initState } from './initState';
import { initEmitter } from './initEmitter';
import { globalView } from './views/global';

export default (() => {
	const app = choo({ hash: true });
	// Reminder: outlinks require `target="_blank"` *and* `rel="noopener noreferrer"`

	if (process.env.NODE_ENV !== 'production') {
	  return import('choo-devtools').then(chooDevtools => {
	  	app.use(chooDevtools());
	  	run(app);
	  });
	}

	run(app);
})();

function run(app) {
	app.use(initState);
	app.use(initEmitter);
	app.route('/:pageSlug', globalView);
	app.mount('body');
}
