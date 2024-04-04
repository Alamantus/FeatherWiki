/**
 * Modified from pell, the simplest and smallest WYSIWYG text editor for web, with no dependencies
 * https://github.com/jaredreich/pell
 * 
 * Several customization options have been removed to work with Feather Wiki specifically.
 * 
 * @licence MIT
 */

// Shorten the names of these to help the minifier
const fb = 'formatBlock'
const ael = (parent, type, listener) => parent.addEventListener(type, listener)
const ac = (parent, child) => parent.appendChild(child)
// const qcs = command => document.queryCommandState(command)

const exec = (command, value = null) => document.execCommand(command, false, value)

const init = settings => {
  const content = settings.element.content = html`<div class="ed-content" contenteditable="true" oninput=${({ target: { firstChild } }) => {
    if (firstChild && firstChild.nodeType === 3) exec(fb, '<p>');
    else if (content.innerHTML === '<br>') content.innerHTML = '';
    settings.onChange(content.innerHTML)
  }} onkeydown=${event => {
    if (event.key === 'Enter' && document.queryCommandValue(fb).match(/blockquote|h\d/)) {
      setTimeout(() => exec(fb, '<p>'), 0);
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      setTimeout(() => exec(event.shiftKey ? 'outdent' : 'indent'), 0);
    }
  }}></div>`;

  const actionbar = html`<div class="ed-actionbar" role="toolbar">
    ${FW.state.edActions.map(action => {
      if (action.result === 'settings.insert') {
        action.result = settings.insert;
      }
      const button = html`<button class="ed-button" type="button" title="${action.title}" onclick=${() => action.result() && content.focus()}>
        ${html.raw(action.icon)}
      </button>`;

      if (action.state) {
        const handler = () => button.classList[action.state() ? 'add' : 'remove']('ed-selected')
        ael(content, 'keyup', handler)
        ael(content, 'mouseup', handler)
        ael(button, 'click', handler)
      }

      return button
    })}
  </div>`;
  ac(settings.element, actionbar)
  ac(settings.element, content)

  exec('defaultParagraphSeparator', 'p')

  return settings.element
}

export default { exec, init }
