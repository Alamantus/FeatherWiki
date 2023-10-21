/**
 * Modified beyond recognition from md.js, a lightweight markdown parser
 * https://github.com/thysultan/md.js
 * 
 * @licence MIT
 */
/**
 * Supports Markdown Features:
 * - HTML
 * - headings h1–h6+ (# h1, ## h2, ### h3, etc.)
 * - paragraphs (\n\n)
 * - line breaks (  \n)
 * - blockquotes (> text)
 * - horizontal rule (---, ***, - - -, * * *)
 * - code blocks (```)
 * - inline code (`code`)
 * - images with alt text & optional title (![alt](image_src "optional title"))
 * - inline Markdown links with optional title ([link text](link_url "optional title"))
 * - auto links & email linking (<http://url.domain>, <person@email.example>)
 * - lists with indentation (- list item, * list item, + list item)
 * - checkboxes ([ ], [x])
 * - bold, italic (**bold**, __bold__, *italic*, _italic_, ***bold & italic***, ___bold & italic___, **_bold & italic_**, etc.)
 * - strikethrough (~~strikethrough~~)
 * - escaped characters (\*, \_)
 */
const charMap = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '&': '&amp;',
  '[': '&#91;',
  ']': '&#93;',
  '(': '&#40;',
  ')': '&#41;',
  '_': '&#95;',
  '*': '&ast;',
  '`': '&#96;',
};
// Save non-& charMap values without `&` to more easily check for double-escaped htmlEntity values
const doubleEscaped = Object.keys(charMap).filter(c => c != '&').map(c => charMap[c].replace(c != '&' ? '&' : '', ''));

const htmlEntity = str => {
  return str.replace(/[<>&\(\)\[\]"']/g, c => (charMap[c] || c))
    .replace(new RegExp(`&amp;(${doubleEscaped.join('|')})`, 'g'), '&$1');
}

/**
 * markdown parser
 * 
 * @param  {string} markdown
 * @return {string}
 */
export default function md (markdown) {
  if (!markdown) {
    return '';
  }

  var code = [];
  var cIdx = 0; // Code index
  var html = [];
  var hIdx = 0; // HTML index
  var length = markdown.length;

  // to allow matching trailing paragraphs
  if (markdown[length-1] !== '\n' && markdown[length-2] !== '\n') {
    markdown += '\n\n';
  }

  // format, removes tabs, leading and trailing spaces
  markdown = (
    markdown
      // escaped characters
      .replace(/\\(.)/g, (m, c) => (charMap[c] || m))
      // collect code blocks and replace with placeholder
      // we do this to avoid code blocks matching the paragraph regexp
      .replace(/```(.*)\n([^\0]+?)```(?!```)/gm, (m, lang, block) => {
        code[cIdx] = {lang, block: htmlEntity(block)};
        return `{code-${cIdx++}}`;
      })
      // inline code
      .replace(/`([^`]+?)`/g, (m, code) => `<code>${ htmlEntity(code) }</code>`)
      // auto links
      .replace(/<([^>\s]+(\/\/|@)[^>\s]+)>/g, (m, url, method) => `[${ url }](${ method === '@' ? 'mailto:' : '' }${url})`)
      // links
      .replace(/(!?)\[([^\]]*?)\]\(([^\s\n]*)(?:| "(.*)")\)/gm, (m, img, text, url, title) => {
        text = htmlEntity(text);
        // try to decode url before re-encoding it in case it has encoded values to prevent encoding the % character
        try { url = decodeURI(url); } catch {} // using try/catch because a malformed URI throws an error
        url = encodeURI(url);
        title = title ? ` title="${ htmlEntity(title) }"` : '';
        if (img) return `<img src="${ url }" alt="${text}"${title}>`;
        return `<a href="${ url }"${ title }>${ text }</a>`;
      })
      // HTML tags
      .replace(/(<\/?[a-zA-Z]+[^>]*>)/gm, (m, tag) => {
        html[hIdx] = tag;
        return `{html-${hIdx++}}`;
      })
      // blockquotes
      .replace(/^[ \t]*>+ (.*)/gm, '<blockquote>\n$1\n</blockquote>')
      .replace(/(<\/blockquote>\n?<blockquote>)+?/g, '')
      // headings
      .replace(/^(#+) +(.*)/gm, (m, hash, content) => `<h${ hash.length }>${ content }</h${ hash.length }>`)
      // headings h1 (commonmark)
      .replace(/^([^\n\t ])(.*)\n====+/gm, '<h1>$1$2</h1>')
      // headings h2 (commonmark)
      .replace(/^([^\n\t ])(.*)\n----+/gm, '<h2>$1$2</h2>')
      // horizontal rule 
      .replace(/\n( *[-*]){3,}\n/gm, '<hr>')
      // checkboxes
      .replace(/\[( |x)\]/g, (m, checked) => `<input type="checkbox" disabled${ checked.toLowerCase() === 'x' ? ' checked' : '' }>`)
      // line breaks
      .replace(/  +\n/gm, '<br>')
      // paragraphs - exclude lists, already-rendered HTML, & whitespace
      .replace(/^([^-\+\*\d<\t \n])([^]*?)(?:\n\n)/gm, (m, leadingCharacter, body) => `<p>${ leadingCharacter }${ body }</p>\n`)
      // lists
      .replace(/^([\t ]*)(?:(-|\+|\*)|(\d+(?:\)|\.))) (.*)/gm, (m, leading, b, numbered, content) => {
        leading = leading.replace(/  /g, '\t');
        const type = numbered ? 'o' : 'u';
        return `${leading}<${type}l><li>${content}</li></${type}l>`;
      })
  );

  // This handles *almost* all combinations, but some indented lists combining ul & ol don't render right
  var indentListRegExp = /<\/li><\/(u|o)l>\n(\t+)<(u|o)l><li>(.*)<\/li><\/(u|o)l>/;
  while (markdown.match(indentListRegExp)) {
    markdown = markdown.replace(indentListRegExp, function(m, parentEnd, tabs, childStart, content, childEnd) {
      if (tabs.length > 0) {
        tabs = tabs.substring(1);
        if (tabs.length > 0) tabs = '\n' + tabs;
      }
      return `${tabs}<${childStart}l><li>${content}</li></${childEnd}l></li></${parentEnd}l>`;
    });
  }

  markdown = (
    markdown
  // Combine lists
      .replace(/(<\/ul>\n?[ \t]*<ul>)+?/g, '')
      .replace(/(<\/ol>\n?[ \t]*<ol>)+?/g, '')
      // strong
      .replace(/\*\*([^\n*]+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^\n_]+?)__/g, '<strong>$1</strong>')
      // emphasis
      .replace(/\*([^\n*]+?)\*/g, '<em>$1</em>')
      .replace(/_([^\n_]+?)_/g, '<em>$1</em>')
      // strike through
      .replace(/(?:~~)([^~]+?)(?:~~)/g, '<del>$1</del>')
  );

  // replace html tag placeholders
  for (let i = 0; i < hIdx; i++) {
    markdown = markdown.replace(`{html-${i}}`, html[i]);
  }

  // replace code block placeholders
  for (let i = 0; i < cIdx; i++) {
    const { lang, block } = code[i];
    markdown = markdown.replace(
      `{code-${i}}`,
      `<pre><code${lang ? ` class="language-${ lang }"` : ''}>${htmlEntity(block)}</code></pre>`
    );
  }

  return markdown.trim();
}
