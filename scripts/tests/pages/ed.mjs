import assert from "assert";
import { expectText, expectVisible } from "../../tests.mjs";
import { By, until, WebDriver } from "selenium-webdriver";
import { createNewPage, saveOpenedPage } from "./index.mjs";

/**
 * Pages can be created using the New Page button and display correctly when saved
 * @param {WebDriver} driver The initialized browser driver
 * @return {void}
 */
export async function canCreateNewPageWithEd(driver) {
  const newPage = await createNewPage(driver, null, null, true);

  await expectText(driver, 'main > section header h1', newPage.title);
  await expectText(driver, 'main > section > article.uc', newPage.content);
  const url = await driver.getCurrentUrl();
  assert.match(url, new RegExp('page=' + newPage.slug), `URL ${url} does not contain the slug ${newPage.slug}`);
  await expectText(driver, 'main .sb nav ul li:first-child', newPage.title);
}

/**
 * Created pages can be edited with new content and title successfully
 * @param {WebDriver} driver The initialized browser driver
 * @return {void}
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
