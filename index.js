import choo from 'choo';
import { initState } from './initState';
import { initEmitter } from './initEmitter';
import { globalView } from './views/global';

export default (() => {
	const app = choo({ hash: true });
	// Reminder: outlinks require `target="_blank"` *and* `rel="noopener noreferrer"`

	if (process.env.NODE_ENV !== 'production') {
		app.use(require('choo-devtools')());
	}

	run(app);
})();

function run(app) {
	app.use(initState);
	app.use(initEmitter);
	app.route('/:p', globalView);
	app.mount('body');
}
