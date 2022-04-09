import.meta.hot;
import choo from 'choo';
import { initState } from './initState';
import { initEmitter } from './initEmitter';
import { globalView } from './views/global';

const app = choo({ hash: true });
// Reminder: outlinks require `target="_blank"` *and* `rel="noopener noreferrer"`

if (__SNOWPACK_ENV__.MODE === 'development') {
  const chooDevtools = await import('choo-devtools');
  app.use(chooDevtools.default());
}

app.use(initState);
app.use(initEmitter);
app.route('/:pageSlug', globalView);
app.mount('body');
