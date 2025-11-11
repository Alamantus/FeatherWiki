import assert from "assert";
import { expectText } from "../../tests.mjs";
import { By, Select, WebDriver } from "selenium-webdriver";
import { createNewPage, saveOpenedPage } from "./index.mjs";

/**
 * A page can be set as another page's parent, and it will display the nesting correctly
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canCreateChildPage(driver) {
  const parentPage = await createNewPage(driver, null, 'Parent Page', true);
  const childPage = await createNewPage(driver, null, 'Child Page');

  const optionText = `${parentPage.title} (${parentPage.slug})`;
  const parentField = await expectText(driver, '#parent', 'None\n' + optionText);
  const select = new Select(parentField);
  const parentOption = await expectText(driver, '#parent option:nth-child(2)', optionText);
  await select.selectByVisibleText(optionText);
  assert.equal(true, await parentOption.isSelected());

  await saveOpenedPage(driver);

  await expectText(driver, 'main .sb nav ul li:nth-child(1) > details > summary', parentPage.title, 'Parent page should be a details element');
  await expectText(driver, 'main .sb nav ul li:nth-child(1) > details > ul li:nth-child(1)', childPage.title, 'Child page should be inside a details element');

  const breadcrumb = await driver.findElement(By.css('main > section > header > a'));
  const breadcrumbHref = await breadcrumb.getAttribute('href');
  assert.equal(breadcrumbHref, `http://localhost:3000/?page=${parentPage.slug}`, 'Breadcrumb on child page should link to parent page');

  await breadcrumb.click();

  await expectText(driver, 'main > section > footer ul li', childPage.title, 'Sub Pages list on parent page should list child page');
}
