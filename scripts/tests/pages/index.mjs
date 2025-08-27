import { By, until, WebDriver } from "selenium-webdriver";
import { expectText, expectValue, expectVisible } from "../../tests.mjs";

/**
 * Create and fill a new page on the wiki without saving
 * 
 * @param {WebDriver} driver The initialized browser driver
 * @param {?String} editor The editor to use
 * @param {?String} pageTitle The title of the page to create
 * @param {?Boolean} save Click the save button after creating
 * 
 * @returns {Object}
 */
export async function createNewPage(driver, editor = 'ed', pageTitle = null, save = false) {
  const newPageExpander = await expectText(driver, 'main > .sb nav > details summary', 'New Page');
  await newPageExpander.click();
  const newPageField = await expectVisible(driver, '#np', 'The New Page field should be visible');

  const newPageTitle = pageTitle ?? 'Page Title';
  const newPageSlug = await driver.executeScript('return FW.slug(arguments[0])', newPageTitle);
  await newPageField.sendKeys(newPageTitle);
  await driver.findElement(By.css('main .sb nav details form button')).click();

  // Should go to new page edit with title and slug filled
  await expectText(driver, 'main > section header h1', 'Edit Page');
  await expectValue(driver, 'main > section header #name', newPageTitle);
  await expectValue(driver, 'main > section header #slug', newPageSlug);
  let textarea;
  if (editor === 'md') {
    await driver.findElement(By.css('main > section form > div.w1.tr button')).click();
    await expectVisible(driver, 'main > section form > textarea', 'The markdown textarea should be visible');
    textarea = await driver.findElement(By.css('main > section form > textarea'));
    await driver.wait(until.elementIsVisible(textarea));
    await textarea.click();
  } else {
    await expectVisible(driver, '#e', 'The visual editor should be visible');
    textarea = await driver.findElement(By.css('#e .ed-uc'));
    await driver.wait(until.elementIsVisible(textarea));
    await textarea.click();
  }
  const newPageContent = 'This is a new page';
  await textarea.sendKeys(newPageContent);

  if (save) {
    await saveOpenedPage(driver);
  }

  return {
    title: newPageTitle,
    slug: newPageSlug,
    content: newPageContent,
  };
}

/**
 * Create and fill a new page on the wiki without saving
 * 
 * @param {WebDriver} driver The initialized browser driver
 * 
 * @returns {void}
 */
export async function saveOpenedPage(driver) {
  await driver.findElement(By.css('main > section > form footer button[type="submit"]')).click();
  await driver.sleep(200);
}
