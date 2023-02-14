/**
 * Modified beyond recognition from md.js, a lightweight markdown parser
 * https://github.com/thysultan/md.js
 * 
 * @licence MIT
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
};
// const mapChar = {};
// Object.keys(charMap).forEach(c => mapChar[charMap[c]] = c);

const htmlEntity = str => str.replace(/[<>&\(\)\[\]"']/g, c => (charMap[c] || c));

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
  var index = 0;
  var length = markdown.length;

  // to allow matching trailing paragraphs
  if (markdown[length-1] !== '\n' && markdown[length-2] !== '\n') {
    markdown += '\n\n';
  }

  // format, removes tabs, leading and trailing spaces
  markdown = (
    markdown
      // escaped characters
      .replace(/\\(.)/g, (match, c) => (charMap[c] || match))
      // collect code blocks and replace with placeholder
      // we do this to avoid code blocks matching the paragraph regexp
      .replace(/```(.*)\n([^\0]+?)```(?!```)/gm, function (match, lang, block) {
        var placeholder = '{code-block-'+index+'}';
        var regex = new RegExp('{code-block-'+index+'}', 'g');

        code[index++] = {lang: lang, block: htmlEntity(block), regex: regex};

        return placeholder;
      })
      // blockquotes
      .replace(/^[ \t]*>+ (.*)/gm, '<blockquote>\n$1\n</blockquote>')
      .replace(/(<\/blockquote>\n?<blockquote>)+?/g, '')
      // headings
      .replace(/^(#+) +(.*)/gm, (m, hash, content)  => `<h${ hash.length }>${ content }</h${ hash.length }>`)
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
      // inline code
      .replace(/`([^`]+?)`/g, (m, code) => `<code>${ htmlEntity(code) }</code>`)
      // auto links
      .replace(/<([^>\s]+(\/\/|@)[^>\s]+)>/g, (m, url, method) => `[${ url }](${ method === '@' ? 'mailto:' : '' }${url})`)
      // links
      .replace(/(!?)\[([^\]]*?)\]\(([^\s\n]*)(?:| "(.*)")\)/gm, (m, img, text, link, title) => {
        text = htmlEntity(text);
        link = encodeURI(link);
        title = title ? ` title="${ htmlEntity(title) }"` : '';
        if (img) return `<img src="${ link }" alt="${text}"${title}>`;
        return `<a href="${ link }"${ title }>${ text }</a>`;
      })
      // lists
      .replace(/^([\t ]*)(?:(-|\+|\*)|(\d+(?:\)|\.))) (.*)/gm, (m, leading, bullet, numbered, content) => {
        leading = leading.replace(/  /g, '\t');
        const type = numbered ? 'o' : 'u';
        return `${leading}<${type}l><li>${content}</li></${type}l>`;
      })
  );
  // Find any `a` tags with underscores in the href (must be wrapped in quotes) and any internal links
  // and replace any instance of underscore or asterisk with replacement characters so they are not parsed
  const u = '\uFFFC', a = '\uFFFD';
  (markdown.match(/href="([^"]*[_*][^"]*)"|\[\[[^\]]+\]\]/gm) ?? []).forEach(m => {
    markdown = markdown.replace(
      m,
      m.replace(/_/g, u)
        .replace(/\*/g, a)
    );
  });

  // This handles *almost* all combinations, but some indented lists combining ul & ol don't render right
  var indentListRegExp = /<\/li><\/(u|o)l>\n(\t+)<(u|o)l><li>(.*)<\/li><\/(u|o)l>/;
  while (markdown.match(indentListRegExp)) {
    markdown = markdown.replace(indentListRegExp, function(match, parentEnd, tabs, childStart, content, childEnd) {
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
      // strong emphasis
      .replace(/(?:\*\*|__*)[_*]([^\n*_]+?)[_*](?:\*\*|__)/g, '<strong><em>$1</em></strong>')
      // strong
      .replace(/(?:\*\*|__)([^\n*_]+?)(?:\*\*|__)/g, '<strong>$1</strong>')
      // emphasis
      .replace(/(?:\*|_)([^\n*_]+?)(?:\*|_)/g, '<em>$1</em>')
      // strike through
      .replace(/(?:~~)([^~]+?)(?:~~)/g, '<del>$1</del>')
  );

  // replace code block placeholders
  for (var i = 0; i < index; i++) {
    var item = code[i];
    var lang = item.lang;
    var block = item.block;

    markdown = markdown.replace(item.regex, () => `<pre><code${lang ? ` class="language-${ lang }"` : ''}>${block}</code></pre>`);
  }

  markdown = markdown.replace(new RegExp(u, 'g'), '_').replace(new RegExp(a, 'g'), '*');

  return markdown.trim();
}
