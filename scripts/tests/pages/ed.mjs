import assert from "assert";
import { expectHtml, expectText, expectValue, expectVisible } from "../../tests.mjs";
import { By, until, WebDriver } from "selenium-webdriver";
import { createNewPage, saveOpenedPage } from "./index.mjs";
import path from "path";

/**
 * Pages can be created using the New Page button and display correctly when saved
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canCreateNewPageWithEd(driver) {
  const newPage = await createNewPage(driver, 'ed', null, true);

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
export async function canEditNewPageWithEd(driver) {
  await canCreateNewPageWithEd(driver);

  const editButton = await expectText(driver, 'main > section header button', 'Edit');
  await editButton.click();
  await expectVisible(driver, '#e', 'The visual editor should be visible');
  const textarea = await driver.findElement(By.css('#e .ed-uc'));
  await driver.wait(until.elementIsVisible(textarea));
  await textarea.click();
  await textarea.clear();
  const newPageContent = 'The page has been edited';
  await textarea.sendKeys(newPageContent);
  await saveOpenedPage(driver);

  await expectText(driver, 'main > section > article.uc', newPageContent);
}

/**
 * Click the "Show HTML button in the edit page view
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
async function clickShowHtmlButton(driver) {
  const htmlButton = await expectText(driver, 'main > section form div.tr button[type="button"]', 'Show HTML');
  htmlButton.click();
  await driver.sleep(500);
}

/**
 * Pages can edit the raw HTML of its content
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canModifyRawHtmlWithEd(driver) {
  await createNewPage(driver, 'ed');

  await clickShowHtmlButton(driver);

  const textarea = await driver.findElement(By.css('main > section form > textarea'));
  await driver.wait(until.elementIsVisible(textarea));
  await textarea.click();
  await textarea.clear();
  const html = '<p>This is custom HTML</p>';
  textarea.sendKeys(html);

  await saveOpenedPage(driver);

  await expectHtml(driver, 'main > section > article.uc', html);
}

/**
 * Upload an expected test image and return its expected data
 * @param {WebDriver} driver
 * @return {Promise<Object>}
 */
 async function uploadImageWithEd(driver) {
  // Overwrite FW.upload() to not rely on file selector modal
  await driver.executeScript('FW.upload = (mime, cb) => {'
  + 'const input = html`<input type="file" accept=${mime} onchange=${e => {'
    + 'const f = e.target.files;'
    + 'if (f.length > 0) cb(f[0]);'
    + 'document.body.removeChild(input);'
  + '}} />`;'
  + 'document.body.appendChild(input);'
  + '};');

  await driver.sleep(500);
  const textarea = await driver.findElement(By.css('#e .ed-uc'));
  await driver.wait(until.elementIsVisible(textarea));
  await textarea.click();
  await textarea.clear();

  const insertButton = await expectText(driver, 'main > section form div#e button[title="Insert Image from File"]', '📸');
  insertButton.click();

  await driver.wait(until.alertIsPresent());
  const confirmUpload = await driver.switchTo().alert();
  const confirmUploadText = await confirmUpload.getText();
  assert.equal(confirmUploadText, "Inserting images increases your wiki's file size. Continue?");
  await confirmUpload.accept();

  // Image path is relative to current directory, i.e. project root
  const image = path.resolve('logo.svg');
  await driver.sleep(500);
  await driver.findElement(By.css('body input[type="file"]:last-of-type'))
    .sendKeys(image);

  await driver.wait(until.alertIsPresent());
  const widthPrompt = await driver.switchTo().alert();
  const widthPromptText = await widthPrompt.getText();
  assert.equal(widthPromptText, 'Max width pixels:');
  await widthPrompt.sendKeys('10');
  await widthPrompt.accept();

  await driver.wait(until.alertIsPresent());
  const heightPrompt = await driver.switchTo().alert();
  const heightPromptText = await heightPrompt.getText();
  assert.equal(heightPromptText, 'Max height pixels:');
  await heightPrompt.sendKeys('10');
  await heightPrompt.accept();

  await driver.wait(until.alertIsPresent());
  const altPrompt = await driver.switchTo().alert();
  const altPromptText = await altPrompt.getText();
  assert.equal(altPromptText, 'Alt text:');
  await altPrompt.accept();

  // Keeping this commented in case image changes and test needs to be updated
  // const html = await driver.executeScript('return document.querySelector("#e .ed-uc")?.innerHTML ?? null');
  // console.log(html);

  const hash = '-553774246';
  const data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAABfklEQVQYV2PUiJqz/Nuv3+cfrcnsYoAAdiD+CWUzyIVOr+BkZ9FhVAideZ2DjUnt869fxk9XZ18wiWj2e/zm65WXezruSYfOMuBnZzr/9efvm4zyIdOPCvKyW7z7/OvMozUZ5nqhrUtff/j24Pnu1mqg3DkBHjbD919/HWWUC50RIsjNtvLT998Mf3790+dleLv6/Zcfj5h4ZMrY2ZjOc7EzMwLlQhllQvs4mf9zPRDlZxd59elnI/efNxUfvnx/w8Ivu1CMn73mzacfrx9++S3LCHI00IpaEX6Ohtcffx7j/P3K5suP379Y+KTPivCxW776+Kv68Zr0NrBChdCpElxs7A9//f33i+HbS84fv/8ycAlK/WJhYmJ5+/W3zMv1ma/ACkFALnhmHj83S+vXD8/Z//7595dPVPrfx6+/K4AenAyShyuU8p3JJcDPfOHHx9eMQJMl+YTFXnz48E/v2eb0bygKQRxxt0XcrP8uZbGxsf36zC099/Xq7C8wGwFYd6q/Ia1YEwAAAABJRU5ErkJggg==';

  return {
    hash,
    data,
  };
}

/**
 * Images can be uploaded, stored, and shown in HTML
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canUploadImageWithEd(driver) {
  await createNewPage(driver, 'ed');

  const img = await uploadImageWithEd(driver);
  const html = `<p><img src="${img.data}#${img.hash}"></p>`;
  await expectHtml(driver, '#e .ed-uc', html);
}

/**
 * Image data is converted to id shorthand when viewing HTML
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function doesShortenImageDataInHtmlView(driver) {
  await createNewPage(driver, 'ed');

  const img = await uploadImageWithEd(driver);

  await clickShowHtmlButton(driver);

  const html = `<p><img src="img:${img.hash}:img"></p>`;
  await expectValue(driver, 'main > section form > textarea', html);
}

/**
 * Fill the visual editor with the given text and select all of its content
 * @param {WebDriver} driver
 * @param {String} text
 * @returns {Promise<import('selenium-webdriver').WebElement>}
 */
async function typeAndSelectAllInEd(driver, text) {
  const editor = await driver.findElement(By.css('#e .ed-uc'));
  await driver.wait(until.elementIsVisible(editor));
  await editor.click();
  await editor.clear();
  await editor.sendKeys(text);
  await driver.executeScript(
    'const el = document.querySelector("#e .ed-uc");'
    + 'el.focus();'
    + 'const range = document.createRange();'
    + 'range.selectNodeContents(el);'
    + 'const sel = window.getSelection();'
    + 'sel.removeAllRanges();'
    + 'sel.addRange(range);'
  );
  return editor;
}

/**
 * Focus the visual editor and place the caret at the end of its content
 * @param {WebDriver} driver
 * @returns {Promise<void>}
 */
async function focusEdCaretAtEnd(driver) {
  await driver.executeScript(
    'const el = document.querySelector("#e .ed-uc");'
    + 'el.focus();'
    + 'const range = document.createRange();'
    + 'range.selectNodeContents(el);'
    + 'range.collapse(false);'
    + 'const sel = window.getSelection();'
    + 'sel.removeAllRanges();'
    + 'sel.addRange(range);'
  );
}

/**
 * Click a visual editor toolbar button by its translated title attribute
 * @param {WebDriver} driver
 * @param {String} title
 * @returns {Promise<void>}
 */
async function clickEdToolbarButton(driver, title) {
  const button = await driver.findElement(
    By.css(`#e .ed-bar button[title="${title}"]`)
  );
  await button.click();
  await driver.sleep(150);
}

/**
 * Return the current innerHTML of the visual editor
 * @param {WebDriver} driver
 * @returns {Promise<String>}
 */
async function getEdHtml(driver) {
  return await driver.executeScript(
    'return document.querySelector("#e .ed-uc").innerHTML'
  );
}

/**
 * The Bold toolbar button wraps the current selection in a bold element
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canBoldSelectionWithEdToolbar(driver) {
  await createNewPage(driver, 'ed');
  await typeAndSelectAllInEd(driver, 'Bold text');
  await clickEdToolbarButton(driver, 'Bold');

  const html = await getEdHtml(driver);
  assert.match(
    html,
    /<(?:b|strong)>[\s\S]*Bold text[\s\S]*<\/(?:b|strong)>/i,
    `Expected bolded text in editor HTML, got ${html}`
  );
}

/**
 * The Italic toolbar button wraps the current selection in an italic element
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canItalicizeSelectionWithEdToolbar(driver) {
  await createNewPage(driver, 'ed');
  await typeAndSelectAllInEd(driver, 'Italic text');
  await clickEdToolbarButton(driver, 'Italic');

  const html = await getEdHtml(driver);
  assert.match(
    html,
    /<(?:i|em)>[\s\S]*Italic text[\s\S]*<\/(?:i|em)>/i,
    `Expected italicized text in editor HTML, got ${html}`
  );
}

/**
 * The Underline toolbar button wraps the current selection in an underline element
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canUnderlineSelectionWithEdToolbar(driver) {
  await createNewPage(driver, 'ed');
  await typeAndSelectAllInEd(driver, 'Underlined text');
  await clickEdToolbarButton(driver, 'Underline');

  const html = await getEdHtml(driver);
  assert.match(
    html,
    /<u>[\s\S]*Underlined text[\s\S]*<\/u>/i,
    `Expected underlined text in editor HTML, got ${html}`
  );
}

/**
 * The Heading toolbar button converts the current block to an h2
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canFormatHeadingWithEdToolbar(driver) {
  await createNewPage(driver, 'ed');
  await typeAndSelectAllInEd(driver, 'Section Heading');
  await clickEdToolbarButton(driver, 'Heading');

  const html = await getEdHtml(driver);
  assert.match(
    html,
    /<h2[^>]*>[\s\S]*Section Heading[\s\S]*<\/h2>/i,
    `Expected h2 block in editor HTML, got ${html}`
  );
}

/**
 * The Sub-Heading toolbar button converts the current block to an h3
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canFormatSubHeadingWithEdToolbar(driver) {
  await createNewPage(driver, 'ed');
  await typeAndSelectAllInEd(driver, 'Sub Heading');
  await clickEdToolbarButton(driver, 'Sub-Heading');

  const html = await getEdHtml(driver);
  assert.match(
    html,
    /<h3[^>]*>[\s\S]*Sub Heading[\s\S]*<\/h3>/i,
    `Expected h3 block in editor HTML, got ${html}`
  );
}

/**
 * The Bullet List toolbar button converts the current block into an unordered list
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canCreateBulletListWithEdToolbar(driver) {
  await createNewPage(driver, 'ed');
  await typeAndSelectAllInEd(driver, 'First item');
  await clickEdToolbarButton(driver, 'Bullet List');

  const html = await getEdHtml(driver);
  assert.match(
    html,
    /<ul[^>]*>[\s\S]*<li[^>]*>[\s\S]*First item[\s\S]*<\/li>[\s\S]*<\/ul>/i,
    `Expected bullet list in editor HTML, got ${html}`
  );
}

/**
 * The Number List toolbar button converts the current block into an ordered list
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canCreateNumberListWithEdToolbar(driver) {
  await createNewPage(driver, 'ed');
  await typeAndSelectAllInEd(driver, 'First item');
  await clickEdToolbarButton(driver, 'Number List');

  const html = await getEdHtml(driver);
  assert.match(
    html,
    /<ol[^>]*>[\s\S]*<li[^>]*>[\s\S]*First item[\s\S]*<\/li>[\s\S]*<\/ol>/i,
    `Expected numbered list in editor HTML, got ${html}`
  );
}

/**
 * The Quote toolbar button wraps the current block in a blockquote
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canCreateBlockquoteWithEdToolbar(driver) {
  await createNewPage(driver, 'ed');
  await typeAndSelectAllInEd(driver, 'A famous quote');
  await clickEdToolbarButton(driver, 'Quote');

  const html = await getEdHtml(driver);
  assert.match(
    html,
    /<blockquote[^>]*>[\s\S]*A famous quote[\s\S]*<\/blockquote>/i,
    `Expected blockquote in editor HTML, got ${html}`
  );
}

/**
 * The Separator toolbar button inserts a horizontal rule at the caret position
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canInsertSeparatorWithEdToolbar(driver) {
  await createNewPage(driver, 'ed');
  await typeAndSelectAllInEd(driver, 'Before separator');
  await focusEdCaretAtEnd(driver);
  await clickEdToolbarButton(driver, 'Separator');

  const html = await getEdHtml(driver);
  assert.match(
    html,
    /<hr[^>]*>/i,
    `Expected horizontal rule in editor HTML, got ${html}`
  );
}

/**
 * The Link toolbar button prompts for a URL and wraps the selection in an anchor tag
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canInsertLinkWithEdToolbar(driver) {
  await createNewPage(driver, 'ed');
  await typeAndSelectAllInEd(driver, 'Click here');

  const linkButton = await driver.findElement(
    By.css('#e .ed-bar button[title="Link"]')
  );
  await linkButton.click();

  await driver.wait(until.alertIsPresent(), 1000);
  const prompt = await driver.switchTo().alert();
  const promptText = await prompt.getText();
  assert.strictEqual(
    promptText,
    'Link URL:',
    `Link toolbar prompt should ask for a URL, got "${promptText}"`
  );
  await prompt.sendKeys('https://example.com/');
  await prompt.accept();
  await driver.sleep(200);

  const html = await getEdHtml(driver);
  assert.match(
    html,
    /<a[^>]*href="https:\/\/example\.com\/?"[^>]*>[\s\S]*Click here[\s\S]*<\/a>/i,
    `Expected anchor link wrapping selection, got ${html}`
  );
}

/**
 * The Link External Image toolbar button prompts for a URL and inserts an img tag
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canInsertExternalImageWithEdToolbar(driver) {
  await createNewPage(driver, 'ed');
  await typeAndSelectAllInEd(driver, '');
  await focusEdCaretAtEnd(driver);

  const externalImageButton = await driver.findElement(
    By.css('#e .ed-bar button[title="Link External Image"]')
  );
  await externalImageButton.click();

  await driver.wait(until.alertIsPresent(), 1000);
  const prompt = await driver.switchTo().alert();
  const promptText = await prompt.getText();
  assert.strictEqual(
    promptText,
    'Image URL:',
    `External image prompt should ask for a URL, got "${promptText}"`
  );
  const imageUrl = 'https://example.com/image.png';
  await prompt.sendKeys(imageUrl);
  await prompt.accept();
  await driver.sleep(200);

  const html = await getEdHtml(driver);
  assert.match(
    html,
    new RegExp(`<img[^>]*src="${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'i'),
    `Expected external image inserted, got ${html}`
  );
}

/**
 * The visual editor toolbar renders every expected formatting button
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function showsAllEdToolbarButtons(driver) {
  await createNewPage(driver, 'ed');
  await expectVisible(driver, '#e .ed-bar', 'The toolbar should be visible');

  const expectedTitles = [
    'Clear Formatting',
    'Bold',
    'Italic',
    'Underline',
    'Heading',
    'Sub-Heading',
    'Paragraph',
    'Align Left',
    'Align Center',
    'Align Right',
    'Number List',
    'Bullet List',
    'Quote',
    'Separator',
    'Link',
    'Link External Image',
    'Insert Image from File',
    'Add Existing Image',
  ];
  for (const title of expectedTitles) {
    await expectVisible(
      driver,
      `#e .ed-bar button[title="${title}"]`,
      `The "${title}" toolbar button should be visible`
    );
  }

  const buttons = await driver.findElements(By.css('#e .ed-bar button.ed-btn'));
  assert.strictEqual(
    buttons.length,
    expectedTitles.length,
    `The toolbar should render ${expectedTitles.length} buttons, got ${buttons.length}`
  );
}

 /**
  * Previously uploaded images can be added to a page
  * @param {WebDriver} driver The initialized browser driver
  * @return {Promise<void>}
  */
export async function canInsertExistingImageIntoEd(driver) {
  await createNewPage(driver, 'ed');

  const img = await uploadImageWithEd(driver);

  // Switch to HTML view to clear the content
  await clickShowHtmlButton(driver);
  await driver.sleep(500);
  const textarea = await driver.findElement(By.css('main > section form > textarea'));
  await driver.wait(until.elementIsVisible(textarea));
  await textarea.click();
  await textarea.clear();

  const editorButton = await expectText(driver, 'main > section form div.tr button[type="button"]', 'Show Editor');
  editorButton.click();
  await driver.sleep(500);

  const existingImageButton = await expectText(driver, 'main > section form div#e button[title="Add Existing Image"]', '📎');
  existingImageButton.click();

  const galleryDialog = await driver.findElement(By.css('dialog#g'));
  await driver.wait(until.elementIsVisible(galleryDialog));
  const insertButton = await expectText(driver, '#g section .g button:last-of-type', 'Insert', 'Could not find Insert button');
  await insertButton.click();
  await driver.sleep(500);

  const html = `<p><img src="${img.data}#${img.hash}"></p>`;
  await expectHtml(driver, '#e .ed-uc', html);
}
