import assert from "assert";
import { createNewPage, expectText } from "../tests.mjs";
import { By, WebDriver } from "selenium-webdriver";

/**
 * When setting tags on a new page, those tags appear on the page and in the sidebar
 * @param {WebDriver} driver The initialized browser driver
 */
export async function canCreateNewPageWithTags(driver) {
  await createNewPage(driver);
  const tagsField = await driver.findElement(By.css('#tags'));
  const tag = 'tag 1';
  tagsField.sendKeys(tag);
  await driver.findElement(By.css('main > section > form footer button[type="submit"]')).click();

  await driver.sleep(200);
  await expectText(driver, 'main > section dl dd', tag, 'Could not find tag on created page');
  await expectText(driver, 'main .sb nav .tabs button:nth-child(2)', 'Tags');
  await driver.findElement(By.css('main .sb nav .tabs button:nth-child(2)')).click();
  await expectText(driver, 'main .sb nav ul li:first-child', tag);
}

/**
 * Pages with tags are filtered correctly when clicking from the sidebar.
 * @param {WebDriver} driver The initialized browser driver
 */
export async function canFilterPagesByTag(driver) {
  await createNewPage(driver, 'ed', 'Untagged Page');
  await driver.findElement(By.css('main > section > form footer button[type="submit"]')).click();
  await canCreateNewPageWithTags(driver);
  await driver.findElement(By.css('main .sb nav ul li:first-child a')).click();
  await expectText(driver, 'main > section header h1', 'Pages Tagged tag 1');
  const list = await expectText(driver, 'main > section article ul', 'Page Title');
  assert.doesNotMatch(await list.getText(), /.*Untagged Page.*/);
}
