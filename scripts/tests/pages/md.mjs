import assert from "assert";
import { expectHtml, expectText, expectVisible } from "../../tests.mjs";
import { By, until, WebDriver } from "selenium-webdriver";
import { createNewPage, saveOpenedPage } from "./index.mjs";

/**
 * Pages can be created using the New Page button and display correctly when saved
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canCreateNewPageWithMd(driver) {
  const newPage = await createNewPage(driver, 'md', null, true);

  await expectText(driver, 'main > section header h1', newPage.title);
  await expectText(driver, 'main > section > article.uc', newPage.content);
  const url = await driver.getCurrentUrl();
  assert.match(url, new RegExp('page=' + newPage.slug), `URL ${url} does not contain the slug ${newPage.slug}`);
  await expectText(driver, 'main .sb nav ul li:first-child', newPage.title);
}

/**
 * Created pages can be edited with new content and title successfully
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canEditNewPageWithMd(driver) {
  await canCreateNewPageWithMd(driver);

  const editButton = await expectText(driver, 'main > section header button', 'Edit');
  await editButton.click();
  await expectVisible(driver, 'main > section form > textarea', 'The markdown textarea should be visible');
  const textarea = await driver.findElement(By.css('main > section form > textarea'));
  await driver.wait(until.elementIsVisible(textarea));
  await textarea.click();
  await textarea.clear();
  const newPageContent = 'The page has been edited';
  await textarea.sendKeys(newPageContent);
  await saveOpenedPage(driver);

  await expectText(driver, 'main > section > article.uc', newPageContent);
}

/**
 * Created pages can be edited with new content and title successfully
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function markdownRendersCorrectly(driver) {
  await createNewPage(driver, 'md');

  const textarea = await driver.findElement(By.css('main > section form > textarea'));
  await driver.wait(until.elementIsVisible(textarea));
  await textarea.click();
  await textarea.clear();
  const markdownContent = `<!--This means we can use HTML elements in Markdown, such as the comment
element, and they won't be affected by a markdown parser. However, if you
create an HTML element in your markdown file, you cannot use markdown syntax
within that element's contents.-->

# This is an \`<h1>\`
## This is an \`<h2>\`
### This is an \`<h3>\`
#### This is an \`<h4>\`
##### This is an \`<h5>\`
###### This is an \`<h6>\`

This is an h1
=============

This is an h2
-------------

*This text is in italics.*
_And so is this text._

**This text is in bold.**
__And so is this text.__

***This text is in both.***
**_As is this!_**
*__And this!__*

~~This text is rendered with strikethrough.~~

This is a paragraph. I'm typing in a paragraph isn't this fun?

Now I'm in paragraph 2.
I'm still in paragraph 2 too!


I'm in paragraph three!

I end with two spaces (highlight me to see them).

There's a \`<br />\`
above me!

> This is a block quote. You can either
> manually wrap your lines and put a \`>\` before every line or you can let your lines get really long and wrap on their own.
> It doesn't make a difference so long as they start with a \`>\`.

> You can only use one level
>> of indentation?
>> Oh well!

* Item
* Item
* Another item

or

+ Item
+ Item
+ One more item

or

- Item
- Item
- One last item

- List
  - Indentation
    - also
  - works!
- (with
  - two
  - spaces)

1. Item one
2. Item two
3. Item three

1. Item one
1. Item two
1. Item three

1. Item one
2. Item two
3. Item three
  * mixing
  * Sub-list types
4. Item four

Boxes below without the 'x' are unchecked HTML checkboxes.
- [ ] First task to complete.
- [ ] Second task that needs done

This checkbox below will be a checked HTML checkbox.

- [x] This task has been completed

\`\`\`
This is code
        So is this
\`\`\`

\`\`\`javascript
function canLabelCode() {
    return true;
}
\`\`\`

\\\`\\\`\\\`
Here's some \\<Escaped text!\\>
\\\`\\\`\\\`

John didn't even know what the \`go_to()\` function did!

***

---

- - -

****************

[Click me!](http://test.com/)

[Click me!](http://test.com/ "Link to Test.com")

[Go to music](/music/).

- [Heading](#heading)
- [Another heading](#another-heading)
- [Chapter](#chapter)
  - [Subchapter <h3 />](#subchapter-h3-)

![This is the alt-attribute for my image](http://imgur.com/myimage.jpg "An optional title")

<http://testwebsite.com/> is equivalent to
[http://testwebsite.com/](http://testwebsite.com/)

<foo@bar.com>

I want to type *this text surrounded by asterisks* but I don't want it to be
in italics, so I do this: \*this text surrounded by asterisks\*.

Your computer crashed? Try sending a
<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Del</kbd>`;
  await textarea.sendKeys(markdownContent);

  await saveOpenedPage(driver);

  // This expected HTML may need to be adjusted to account for what is *actually* expected.
  // Currently it matches the true output as read from Firefox, so the md helper may need
  // to be adjusted in order to get cleaner HTML in the future
  await expectHtml(driver, 'main > section > article.uc', `<!--This means we can use HTML elements in Markdown, such as the comment
<p>element, and they won't be affected by a markdown parser. However, if you
create an HTML element in your markdown file, you cannot use markdown syntax
within that element's contents.--><p></p>
<h1 id="this_is_an_-code--lt-h1-gt---code-">This is an <code>&lt;h1&gt;</code> <a class="l" href="#this_is_an_-code--lt-h1-gt---code-">#</a></h1>
<h2 id="this_is_an_-code--lt-h2-gt---code-">This is an <code>&lt;h2&gt;</code> <a class="l" href="#this_is_an_-code--lt-h2-gt---code-">#</a></h2>
<h3 id="this_is_an_-code--lt-h3-gt---code-">This is an <code>&lt;h3&gt;</code> <a class="l" href="#this_is_an_-code--lt-h3-gt---code-">#</a></h3>
<h4 id="this_is_an_-code--lt-h4-gt---code-">This is an <code>&lt;h4&gt;</code> <a class="l" href="#this_is_an_-code--lt-h4-gt---code-">#</a></h4>
<h5 id="this_is_an_-code--lt-h5-gt---code-">This is an <code>&lt;h5&gt;</code> <a class="l" href="#this_is_an_-code--lt-h5-gt---code-">#</a></h5>
<h6 id="this_is_an_-code--lt-h6-gt---code-">This is an <code>&lt;h6&gt;</code> <a class="l" href="#this_is_an_-code--lt-h6-gt---code-">#</a></h6>

<h1 id="this_is_an_h1">This is an h1 <a class="l" href="#this_is_an_h1">#</a></h1>

<h2 id="this_is_an_h2">This is an h2 <a class="l" href="#this_is_an_h2">#</a></h2>

<em>This text is in italics.</em>
<p><em>And so is this text.</em></p>
<strong>This text is in bold.</strong>
<p><strong>And so is this text.</strong></p>
<em><strong>This text is in both.</strong></em>
<strong><em>As is this!</em></strong>
<em><strong>And this!</strong></em>

<p><del>This text is rendered with strikethrough.</del></p>
<p>This is a paragraph. I'm typing in a paragraph isn't this fun?</p>
<p>Now I'm in paragraph 2.
I'm still in paragraph 2 too!</p>

<p>I'm in paragraph three!</p>
<p>I end with two spaces (highlight me to see them).</p>
<p>There's a <code>&lt;br /&gt;</code>
above me!</p>
<blockquote>
<p>This is a block quote. You can either</p>
<p>manually wrap your lines and put a <code>&gt;</code> before every line or you can let your lines get really long and wrap on their own.</p>
<p>It doesn't make a difference so long as they start with a <code>&gt;</code>.
</p></blockquote><p></p>
<blockquote>
<p>You can only use one level</p>
<p>of indentation?</p>
<p>Oh well!
</p></blockquote><p></p>
<ul><li>Item</li><li>Item</li><li>Another item</li></ul>

<p>or</p>
<ul><li>Item</li><li>Item</li><li>One more item</li></ul>

<p>or</p>
<ul><li>Item</li><li>Item</li><li>One last item</li></ul>

<ul><li>List<ul><li>Indentation<ul><li>also</li></ul></li><li>works!</li></ul></li><li>(with<ul><li>two</li><li>spaces)</li></ul></li></ul>

<ol><li>Item one</li><li>Item two</li><li>Item three</li></ol>

<ol><li>Item one</li><li>Item two</li><li>Item three</li></ol>

<ol><li>Item one</li><li>Item two</li><li>Item three<ul><li>mixing</li><li>Sub-list types</li></ul></li><li>Item four</li></ol>

<p>Boxes below without the 'x' are unchecked HTML checkboxes.
</p><ul><li><input type="checkbox" disabled=""> First task to complete.</li><li><input type="checkbox" disabled=""> Second task that needs done<p></p></li></ul>
<p>This checkbox below will be a checked HTML checkbox.</p>
<ul><li><input type="checkbox" disabled="" checked=""> This task has been completed</li></ul>

<p></p><pre><code>This is code
        So is this
</code></pre><p></p>
<p></p><pre><code class="language-javascript">function canLabelCode() {
    return true;
}
</code></pre><p></p>
<p>\`\`\`
Here's some &lt;Escaped text!&gt;
\`\`\`</p>
<p>John didn't even know what the <code>go_to()</code> function did!
</p><hr><hr><hr><hr>
<a href="http://test.com/" target="_blank" rel="noopener noreferrer">Click me!</a><p></p>
<p><a href="http://test.com/" title="Link to Test.com">Click me!</a></p>
<p><a href="/music/" target="_blank" rel="noopener noreferrer">Go to music</a>.</p>
<ul><li><a href="#heading" target="_blank" rel="noopener noreferrer">Heading</a></li><li><a href="#another-heading" target="_blank" rel="noopener noreferrer">Another heading</a></li><li><a href="#chapter" target="_blank" rel="noopener noreferrer">Chapter</a><ul><li><a href="#subchapter-h3-" target="_blank" rel="noopener noreferrer">Subchapter &lt;h3 /&gt;</a></li></ul></li></ul>

<p><img src="http://imgur.com/myimage.jpg" alt="This is the alt-attribute for my image" title="An optional title"></p>
<p><a href="http://testwebsite.com/" target="_blank" rel="noopener noreferrer">http://testwebsite.com/</a> is equivalent to
<a href="http://testwebsite.com/" target="_blank" rel="noopener noreferrer">http://testwebsite.com/</a></p>
<p><a href="mailto:foo@bar.com" target="_blank" rel="noopener noreferrer">foo@bar.com</a></p>
<p>I want to type <em>this text surrounded by asterisks</em> but I don't want it to be
in italics, so I do this: <em>this text surrounded by asterisks</em>.</p>
<p>Your computer crashed? Try sending a
<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>Del</kbd></p>`);
}
