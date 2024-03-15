/**
 * This file was created by jcoder and is lightly modified from its original source code at
 * https://codeberg.org/jcoder/FeatherWikiExamples/src/branch/main/SunEditorExtension.js
 * It loads the latest version SunEditor (https://github.com/JiHong88/SunEditor) from the JSDelivr CDN
 * and replaces the default Feather Wiki HTML editor on the Render event.
 */
(function sunEditorextension () {
	if (!window.FW._loaded) return setTimeout(sunEditorextension , 1); // wait until FW is mounted
	const { state, emitter } = window.FW;
	const { RENDER } = state.events;
	console.log('running sunEditorextension ');

	const css = document.createElement('link');
	css.rel="stylesheet";
	css.href="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/css/suneditor.min.css";
	document.head.appendChild(css);

	const script = document.createElement('script');
	script.onload = () => { emitter.emit(RENDER) }
	script.type="text/javascript";
	script.src="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/suneditor.min.js";
	document.head.appendChild(script);

	emitter.on(RENDER, () => {
		setTimeout(() => {
			!document.querySelector('main > section > form > div.sun-editor') ? sunEditor() : '';
		}, 50);
	});

	function sunEditor() {
		if (state.edits && !state.edits.useMd) {
			const editor = SUNEDITOR.create((document.getElementById('e') || 'e'),{
				value: state.edits.content,
				buttonList: [
					['undo', 'redo'],
					['font', 'fontSize', 'formatBlock'],
					['paragraphStyle', 'blockquote'],
					['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
					['fontColor', 'hiliteColor', 'textStyle','lineHeight'],
					['removeFormat'],
					['outdent', 'indent'],
					['align', 'horizontalRule', 'list'],
					['table', 'link'],
					['fullScreen', 'showBlocks', 'codeView']
				],
			});
			editor.onChange = function (contents, core) { state.edits.content = contents; }
			editor.setDefaultStyle('font-family: Arial; font-size: 14px;');
		}
	}
})();
