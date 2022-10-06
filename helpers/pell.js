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
const ce = tag => document.createElement(tag)
const qcs = command => document.queryCommandState(command)

export const exec = (command, value = null) => document.execCommand(command, false, value)

export const init = settings => {
  const actions = [
    { // bold
      icon: '<b>B</b>',
      title: 'Bold',
      state: () => qcs('bold'),
      result: () => exec('bold')
    },
    { // italic
      icon: '<i>I</i>',
      title: 'Italic',
      state: () => qcs('italic'),
      result: () => exec('italic')
    },
    { // underline
      icon: '<u>U</u>',
      title: 'Underline',
      state: () => qcs('underline'),
      result: () => exec('underline')
    },
    { // strikethrough
      icon: '<strike>S</strike>',
      title: 'Strike-through',
      state: () => qcs('strikeThrough'),
      result: () => exec('strikeThrough')
    },
    { // heading2
      icon: '<b>H</b>',
      title: 'Heading',
      result: () => exec(fb, '<h2>'),
    },
    { // heading3
      icon: '<b>H<sub>2</sub></b>',
      title: 'Sub-Heading',
      result: () => exec(fb, '<h3>'),
    },
    { // paragraph
      icon: '&#182;',
      title: 'Paragraph',
      result: () => exec(fb, '<p>')
    },
    { // olist
      icon: '&#35;',
      title: 'Number List',
      result: () => exec('insertOrderedList')
    },
    { // ulist
      icon: '&#8226;',
      title: 'Bullet List',
      result: () => exec('insertUnorderedList')
    },
    { // quote
      icon: '&#8220; &#8221;',
      title: 'Quote',
      result: () => exec(fb, '<blockquote>')
    },
    // { // code
    //   icon: '&lt;/&gt;',
    //   title: 'Code',
    //   result: () => exec(fb, '<pre>')
    // },
    { // line
      icon: '&#8213;',
      title: 'Separator',
      result: () => exec('insertHorizontalRule')
    },
    { // link
      icon: '&#128279;',
      title: 'Link',
      result: () => {
        const url = window.prompt('Enter the link URL')
        if (url) exec('createLink', url)
      }
    },
    { // externalImage
      title: 'Link External Image',
      icon: '🖼️',
      result: () => {
        const url = window.prompt('Enter the image URL');
        if (url) exec('insertImage', url);
      },
    },
    { // insertImage
      title: 'Insert Image from File',
      icon: '📸',
      result: () => FW.img.upload(state, insert),
    },
    { // existingImage
      title: 'Add Existing Image',
      icon: '📎',
      result: () => document.getElementById('g').showModal(),
    },
  ];
  const classes = {
    actionbar: 'pell-actionbar',
    button: 'pell-button',
    content: 'pell-content',
    selected: 'pell-button-selected'
  };

  const actionbar = ce('div')
  actionbar.className = classes.actionbar
  actionbar.role = 'toolbar'
  ac(settings.element, actionbar)

  const content = settings.element.content = ce('div')
  content.contentEditable = true
  content.className = classes.content
  content.oninput = ({ target: { firstChild } }) => {
    if (firstChild && firstChild.nodeType === 3) exec(fb, `<p>`)
    else if (content.innerHTML === '<br>') content.innerHTML = ''
    settings.onChange(content.innerHTML)
  }
  content.onkeydown = event => {
    if (event.key === 'Enter' && document.queryCommandValue(fb) === 'blockquote') {
      setTimeout(() => exec(fb, `<p>`), 0)
    }
  }
  ac(settings.element, content)

  actions.forEach(action => {
    const button = ce('button')
    button.className = classes.button
    button.innerHTML = action.icon
    button.title = action.title
    button.setAttribute('type', 'button')
    button.onclick = () => action.result() && content.focus()

    if (action.state) {
      const handler = () => button.classList[action.state() ? 'add' : 'remove'](classes.selected)
      ael(content, 'keyup', handler)
      ael(content, 'mouseup', handler)
      ael(button, 'click', handler)
    }

    ac(actionbar, button)
  })

  if (settings.styleWithCSS) exec('styleWithCSS')
  exec('defaultParagraphSeparator', 'p')

  return settings.element
}

export default { exec, init }