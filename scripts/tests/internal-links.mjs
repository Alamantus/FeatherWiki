import assert from "assert";
import { By, WebDriver } from "selenium-webdriver";
import { expectMissing, expectText, expectVisible } from "../tests.mjs";
import { createNewPage, saveOpenedPage } from "./pages/index.mjs";

/**
 * Type the given markdown content into the currently opened md editor
 * @param {WebDriver} driver
 * @param {String} content
 * @returns {Promise<void>}
 */
async function setMarkdownContent(driver, content) {
  const textarea = await driver.findElement(By.css('main > section form > textarea#md'));
  await textarea.click();
  await textarea.clear();
  await textarea.sendKeys(content);
}

/**
 * `[[Page Title]]` internal links resolve to existing pages and allow navigation
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function rendersInternalLinkToExistingPage(driver) {
  const target = await createNewPage(driver, null, 'Target Page', true);

  await createNewPage(driver, 'md', 'Linking Page');
  await setMarkdownContent(driver, `[[${target.title}]]`);
  await saveOpenedPage(driver);

  const link = await expectText(driver, 'main > section article.uc a[internal]', target.title);
  const href = await link.getAttribute('href');
  assert.match(
    href,
    new RegExp(`\\?page=${target.slug}$`),
    `Internal link href should target the existing page slug, got ${href}`
  );
  const className = (await link.getAttribute('class')) ?? '';
  assert.ok(
    !className.split(/\s+/).includes('e'),
    'Internal link to an existing page should not be marked as missing (class="e")'
  );

  await link.click();
  await expectText(driver, 'main > section header h1', target.title);
  await expectText(driver, 'main > section > article.uc', target.content);
}

/**
 * `[[text|slug]]` renders the alias text and links to the slug target
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function rendersAliasedInternalLink(driver) {
  const target = await createNewPage(driver, null, 'Target Page', true);

  const displayText = 'Go to target';
  await createNewPage(driver, 'md', 'Alias Page');
  await setMarkdownContent(driver, `[[${displayText}|${target.slug}]]`);
  await saveOpenedPage(driver);

  const link = await expectText(driver, 'main > section article.uc a[internal]', displayText);
  const href = await link.getAttribute('href');
  assert.match(
    href,
    new RegExp(`\\?page=${target.slug}$`),
    `Aliased internal link href should target ${target.slug}, got ${href}`
  );

  await link.click();
  await expectText(driver, 'main > section header h1', target.title);
}

/**
 * `[[Page#anchor]]` keeps the anchor fragment in the rendered href
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function preservesAnchorFragmentInInternalLink(driver) {
  const target = await createNewPage(driver, null, 'Target Page', true);

  await createNewPage(driver, 'md', 'Anchor Page');
  await setMarkdownContent(driver, `[[${target.title}#section]]`);
  await saveOpenedPage(driver);

  const link = await expectText(driver, 'main > section article.uc a[internal]', target.title);
  const href = await link.getAttribute('href');
  assert.match(
    href,
    new RegExp(`\\?page=${target.slug}#section$`),
    `Internal link href should include the #section anchor, got ${href}`
  );
}

/**
 * Internal links to pages that do not exist are rendered with the missing (class="e") style
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function marksInternalLinkToMissingPage(driver) {
  const missingTitle = 'Not Yet Created';
  await createNewPage(driver, 'md', 'Linking Page');
  await setMarkdownContent(driver, `[[${missingTitle}]]`);
  await saveOpenedPage(driver);

  const link = await expectText(driver, 'main > section article.uc a.e', missingTitle);
  const className = (await link.getAttribute('class')) ?? '';
  assert.ok(
    className.split(/\s+/).includes('e'),
    'Internal link to a missing page should include the "e" class'
  );
}

/**
 * Headings rendered from page content receive an anchor link that jumps to them
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function headingsGetAnchorLinks(driver) {
  await createNewPage(driver, 'md', 'Heading Anchor Page');
  await setMarkdownContent(driver, '## My Heading\n\nSome content.');
  await saveOpenedPage(driver);

  const heading = await expectVisible(driver, 'main > section > article.uc h2#my_heading');
  const anchor = await heading.findElement(By.css('a.l'));
  const anchorText = await anchor.getAttribute('textContent');
  assert.strictEqual(
    anchorText?.trim(),
    '#',
    `Heading anchor link should render as "#", got "${anchorText}"`
  );
  const anchorHref = await anchor.getAttribute('href');
  assert.match(
    anchorHref,
    /#my_heading$/,
    `Heading anchor href should point to #my_heading, got ${anchorHref}`
  );
}

/**
 * Content wrapped in <nowiki> tags is preserved as-is and skips link/image parsing
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function nowikiSkipsInternalLinkParsing(driver) {
  const literal = '[[Should Not Link]]';
  await createNewPage(driver, 'md', 'Nowiki Page');
  await setMarkdownContent(driver, `<nowiki>${literal}</nowiki>`);
  await saveOpenedPage(driver);

  const article = await driver.findElement(By.css('main > section > article.uc'));
  const text = await article.getText();
  assert.ok(
    text.includes(literal),
    `Nowiki content should be preserved literally, got "${text}"`
  );
  await expectMissing(
    driver,
    'main > section article.uc a[internal]',
    'Content inside <nowiki> should not be converted into internal links'
  );
}
