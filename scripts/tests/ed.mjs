import assert from "assert";
import { expectText, expectValue, expectVisible } from "../tests.mjs";
import { By, WebDriver } from "selenium-webdriver";

/**
 * The title and description of the wiki can be set from the Wiki Settings
 * @param {WebDriver} driver The initialized browser driver
 */
export async function canCreateNewPageWithEd(driver) {
  const newPageExpander = await expectText(driver, 'main > .sb nav > details summary', 'New Page');
  await newPageExpander.click();
  const newPageField = await expectVisible(driver, '#np', 'The New Page field should be visible');

  const newPageTitle = 'Page Title';
  const newPageSlug = 'page_title';
  await newPageField.sendKeys(newPageTitle);
  await driver.findElement(By.css('main .sb nav details form button')).click();

  // Should go to new page edit with title and slug filled
  await expectText(driver, 'main > section header h1', 'Edit Page');
  await expectValue(driver, 'main > section header #name', newPageTitle);
  await expectValue(driver, 'main > section header #slug', newPageSlug);
  await expectVisible(driver, '#e', 'The visual editor should be visible');
  const editor = await driver.findElement(By.css('#e .ed-uc'));
  await editor.click();
  const newPageContent = 'This is a new page';
  await editor.sendKeys(newPageContent);
  await driver.findElement(By.css('main > section > form footer button[type="submit"]')).click();

  await expectText(driver, 'main > section header h1', newPageTitle);
  await expectText(driver, 'main > section > article.uc', newPageContent);
  await expectText(driver, 'main .sb nav ul li:first-child', newPageTitle);
}
