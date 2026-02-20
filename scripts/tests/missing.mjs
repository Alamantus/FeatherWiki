import assert from "assert";
import { By, WebDriver } from "selenium-webdriver";
import { expectMissing, expectText, expectValue } from "../tests.mjs";
import { createNewPage, saveOpenedPage } from "./pages/index.mjs";

/**
 * Internal links to pages that don't yet exist should display in the Missing Pages view
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function showsMissingInternalLinks(driver) {
  const missingTitle = 'Missing Page';

  await createNewPage(driver, 'md', 'Linking Page');
  const markdownEditor = await driver.findElement(
    By.css('main > section form > textarea#md')
  );

  await markdownEditor.click();
  await markdownEditor.clear();
  await markdownEditor.sendKeys(`[[${missingTitle}]]`);
  await saveOpenedPage(driver);

  await expectText(driver, 'main > section article.uc a.e', missingTitle);

  const missingPagesLink = await expectText(
    driver,
    'main .sb nav ul li:last-child a',
    'Missing Pages'
  );
  await missingPagesLink.click();

  await expectText(driver, 'main > section header h1', 'Missing Pages');
  const missingList = await driver.findElement(
    By.css('main > section article ul')
  );
  assert.match(
    await missingList.getText(),
    new RegExp(missingTitle),
    'Missing Pages view should list unresolved internal links'
  );
}

/**
 * Clicking a missing page link should open the editor with the title and slug prefilled
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function autoPopulatesNewPageFromMissingLink(driver) {
  const missingTitle = 'Missing Link Page';

  await createNewPage(driver, 'md', 'Launcher Page');
  const markdownEditor = await driver.findElement(
    By.css('main > section form > textarea#md')
  );

  await markdownEditor.click();
  await markdownEditor.clear();
  await markdownEditor.sendKeys(`[[${missingTitle}]]`);
  await saveOpenedPage(driver);

  const missingLink = await expectText(
    driver,
    'main > section article.uc a.e',
    missingTitle
  );
  await missingLink.click();

  await driver.sleep(200);
  await expectText(driver, 'main > section header h1', 'Edit Page');
  const expectedSlug = await driver.executeScript(
    'return FW.slug(arguments[0])',
    missingTitle
  );
  await expectValue(driver, 'main > section header #name', missingTitle);
  await expectValue(driver, 'main > section header #slug', expectedSlug);
}

/**
 * Resolving a missing link should remove it from the Missing Pages report
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function clearsMissingLinkAfterPageIsCreated(driver) {
  const missingTitle = 'Resolved Missing Page';
  const linkingPage = await createNewPage(driver, 'md', 'Linking Page');

  const markdownEditor = await driver.findElement(
    By.css('main > section form > textarea#md')
  );
  await markdownEditor.click();
  await markdownEditor.clear();
  await markdownEditor.sendKeys(`[[${missingTitle}]]`);
  await saveOpenedPage(driver);

  const missingLink = await expectText(
    driver,
    'main > section article.uc a.e',
    missingTitle
  );
  await missingLink.click();

  await driver.sleep(200);
  await expectText(driver, 'main > section header h1', 'Edit Page');
  await saveOpenedPage(driver);

  await expectText(driver, 'main > section header h1', missingTitle);
  await driver.sleep(200);
  await expectMissing(
    driver,
    'main .sb nav a[href="?page=m"]',
    'Missing Pages link should be removed after resolving all missing links'
  );

  const linkingPageNav = await driver.findElement(
    By.css(`main .sb nav a[href="?page=${linkingPage.slug}"]`)
  );
  await linkingPageNav.click();

  await expectText(driver, 'main > section header h1', linkingPage.title);
  await expectMissing(
    driver,
    'main > section article.uc a.e',
    'Linking page should no longer show unresolved link styling'
  );
}
