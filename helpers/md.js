/*!
 * Modified from md.js is a lightweight markdown parser
 * https://github.com/thysultan/md.js
 * 
 * @licence MIT
 */
var resc = /[<>&\(\)\[\]"']/g;

const unicode = char => ({
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '&': '&amp;',
  '[': '&#91;',
  ']': '&#93;',
  '(': '&#40;',
  ')': '&#41;',
}[char] || char);

var XSSFilterRegExp = /<(script)[^\0]*?>([^\0]+?)<\/(script)>/gmi;
var XSSFilterTemplate = '&lt;$1&gt;$2&lt;/$3&gt;';

var XSSFilterInlineJSRegExp = /(<.*? [^\0]*?=[^\0]*?)(javascript:.*?)(.*>)/gmi;
var XSSFilterInlineJSTemplate = '$1#$2&#58;$3';

var XSSFilterImageRegExp = /<img([^\0]*?onerror=)([^\0]*?)>/gmi;
var XSSFilterImageTemplate = (match, group1, group2) => `<img${group1}${group2.replace(resc, unicode)}>`;

var eventsFilterRegExp = /(<[^]+?)(on.*?=.*?)(.*>)/gm;
var eventsFilterTemplate = '$1$3';

var blockQuotesRegExp = /^[ \t]*> (.*)/gm;
var blockQuotesTemplate = '<blockquote>\n$1\n</blockquote>';
var combineSequentialBlockquotesRegExp = /(<\/blockquote>\n?<blockquote>)+?/g;

var inlineCodeRegExp = /`([^`]+?)`/g;
var inlineCodeTemplate = (match, code) => `<code>${ code.replace(resc, unicode) }</code>`;

var blockCodeRegExp = /```(.*)\n([^\0]+?)```(?!```)/gm;

var imagesRegExp = /!\[(.*)\]\((.*)\)/g;
var imagesTemplate = (match, alt, src) => `<img src="${ src.replace(resc, unicode) }" alt="${ alt.replace(resc, unicode) }">`;

var headingsRegExp = /^(#+) +(.*)/gm;
var headingsTemplate = (match, hash, content)  => `<h${ hash.length }>${ content }</h${ hash.length }>`;

var headingsCommonh1RegExp = /^([^\n\t ])(.*)\n====+/gm;
var headingsCommonh1Template = '<h1>$1$2</h1>';
var headingsCommonh2RegExp = /^([^\n\t ])(.*)\n----+/gm;
var headingsCommonh2Template = '<h2>$1$2</h2>';

var lineBreaksRegExp = /  +\n/gm;
var lineBreaksTemplate = '<br>';

var paragraphsRegExp = /^([^-><#\d\+\_\*\t \n\[\!\{])([^]*?)(?:\n\n)/gm;
var paragraphsTemplate = (match, leadingCharacter, body) => `<p>${ leadingCharacter }${ body }</p>\n`;

// var misplacedParagraphTagRegExp = /^(.+)(?!<\/p>)\n?<p><\/p>/gm;
// var misplacedParagraphTagTemplate = '<p>$1</p>';

var horizontalRegExp = /\n( *[-*]){3,}\n/gm;
var horizontalTemplate = '<hr>';

var strongRegExp = /(?:\*\*|__)([^\n*_]+?)(?:\*\*|__)/g;
var strongTemplate = '<strong>$1</strong>';

var emphasisRegExp = /(?:\*|_)([^\n*_]+?)(?:\*|_)/g;
var emphasisTemplate = '<em>$1</em>';

var strikeRegExp = /(?:~~)([^~]+?)(?:~~)/g;
var strikeTemplate = '<del>$1</del>';

var linksRegExp = /\[([^\]]*?)\]\(([^\s\n]*)(?:| "(.*)")\)/gm;
var linksTemplate = (match, text, link, title) => {
  title = title ? ` title="${ title.replace(resc, unicode) }"` : '';
  return `<a href="${ link.replace(resc, unicode) }"${ title }>${ text.replace(resc, unicode) }</a>`;
};


var listRegExp = /^([\t ]*)(?:(-|\+|\*)|(\d+(?:\)|\.))) (.*)/gm;
var listTemplate = (match, leading, bullet, numbered, content) => {
  leading = leading.replace(/  /g, '\t');
  const type = numbered ? 'o' : 'u';
  return `${leading}<${type}l><li>${content}</li></${type}l>`;
}
var combineSequentialUlRegExp = /(<\/ul>\n?\s*<ul>)+?/g;
var combineSequentialOlRegExp = /(<\/ol>\n?\s*<ol>)+?/g;

var checkBoxesRegExp = /\[( |x)\]/g;
var checkBoxesTemplate = (match, checked) => `<input type="checkbox" disabled${ group1.toLowerCase() === 'x' ? ' checked' : '' }>`;


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
      // collect code blocks and replace with placeholder
      // we do this to avoid code blocks matching the paragraph regexp
      .replace(blockCodeRegExp, function (match, lang, block) {
        var placeholder = '{code-block-'+index+'}';
        var regex = new RegExp('{code-block-'+index+'}', 'g');

        code[index++] = {lang: lang, block: block.replace(resc, unicode), regex: regex};

        return placeholder;
      })
      // XSS script tags
      .replace(XSSFilterRegExp, XSSFilterTemplate)
      // XSS image onerror
      .replace(XSSFilterImageRegExp, XSSFilterImageTemplate)
      // filter events
      .replace(eventsFilterRegExp, eventsFilterTemplate)
      // blockquotes
      .replace(blockQuotesRegExp, blockQuotesTemplate)
      .replace(combineSequentialBlockquotesRegExp, '')
      // images
      .replace(imagesRegExp, imagesTemplate)
      // headings
      .replace(headingsRegExp, headingsTemplate)
      // headings h1 (commonmark)
      .replace(headingsCommonh1RegExp, headingsCommonh1Template)
      // headings h2 (commonmark)
      .replace(headingsCommonh2RegExp, headingsCommonh2Template)
      // horizontal rule 
      .replace(horizontalRegExp, horizontalTemplate)
      // checkboxes
      .replace(checkBoxesRegExp, checkBoxesTemplate)
      // line breaks
      .replace(lineBreaksRegExp, lineBreaksTemplate)
      // paragraphs
      .replace(paragraphsRegExp, paragraphsTemplate)
      // .replace(misplacedParagraphTagRegExp, misplacedParagraphTagTemplate)
      // inline code
      .replace(inlineCodeRegExp, inlineCodeTemplate)
      // links
      .replace(linksRegExp, linksTemplate)
      // lists
      .replace(listRegExp, listTemplate)
  );
  // This handles *almost* all combinations, but some indented lists combining ul & ol don't render right
  var indentListRegExp = /<\/li><\/(u|o)l>\n(\t+)<(u|o)l><li>(.*)<\/li><\/(u|o)l>/;
  while (markdown.match(indentListRegExp)) {
    markdown = markdown.replace(indentListRegExp, function(match, parentEnd, tabs, childStart, content, childEnd) {
      if (tabs.length > 0) {
        tabs = tabs.substring(1);
        if (tabs.length > 0) tabs = '\n' + tabs;
      }
      return `${tabs}<${childStart}l><li>${content}</li></${childEnd}l></li></${parentEnd}l>`;
    })
  }
  markdown = (
    markdown
      // Combine lists
      .replace(combineSequentialUlRegExp, '')
      .replace(combineSequentialOlRegExp, '')
      // strong
      .replace(strongRegExp, strongTemplate)
      // emphasis
      .replace(emphasisRegExp, emphasisTemplate)
      // strike through
      .replace(strikeRegExp, strikeTemplate)
      // filter inline js
      .replace(XSSFilterInlineJSRegExp, XSSFilterInlineJSTemplate)
  );

  // replace code block placeholders
  for (var i = 0; i < index; i++) {
    var item = code[i];
    var lang = item.lang;
    var block = item.block;

    markdown = markdown.replace(item.regex, () => `<pre><code${lang ? ` class="language-${ lang }"` : ''}>${block}</code></pre>`);
  }

  return markdown.trim();
}
