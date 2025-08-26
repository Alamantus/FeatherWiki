import assert from "assert";
import { createNewPage, expectText } from "../tests.mjs";
import { By, WebDriver } from "selenium-webdriver";

/**
 * Pages can be created using the New Page button and display correctly when saved
 * @param {WebDriver} driver The initialized browser driver
 */
export async function canCreateNewPageWithEd(driver) {
  const newPage = await createNewPage(driver);
  await driver.findElement(By.css('main > section > form footer button[type="submit"]')).click();

  await expectText(driver, 'main > section header h1', newPage.title);
  await expectText(driver, 'main > section > article.uc', newPage.content);
  const url = await driver.getCurrentUrl();
  assert.match(url, new RegExp('page=' + newPage.slug), `URL ${url} does not contain the slug ${newPage.slug}`);
  await expectText(driver, 'main .sb nav ul li:first-child', newPage.title);
}
