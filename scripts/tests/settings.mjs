import { expectMissing, expectText, expectValue } from "../tests.mjs";
import { By, Select, WebDriver } from "selenium-webdriver";
import { createNewPage } from "./pages/index.mjs";
import assert from "assert";

/**
 * Click the Wiki Settings link in the side bar
 * @param {WebDriver} driver The initialized browser driver
 * @return {void}
 */
async function openSettings(driver) {
  const settingsLink = await expectText(driver, 'main > .sb nav p a', 'Wiki Settings');
  await settingsLink.click();
  await expectText(driver, 'main > section > header > h1', 'Wiki Settings');
}

/**
 * Click the save button on the settings page
 * @param {WebDriver} driver The initialized browser driver
 * @return {void}
 */
async function saveSettings(driver) {
  let submitButton = await driver.findElement(By.css('main > section form button[type="submit"]'));
  await submitButton.click();
}

/**
 * The title and description of the wiki can be set from the Wiki Settings
 * @param {WebDriver} driver The initialized browser driver
 * @return {void}
 */
export async function canUpdateTitleAndDescription(driver) {
  await openSettings(driver);

  const newTitle = 'Feather Wiki Test';
  const titleField = await expectValue(driver, '#wTitle', 'New Wiki');
  await titleField.clear();
  await titleField.sendKeys(newTitle);

  const newDesc = 'A wiki for running test cases for Feather Wiki';
  const descField = await expectValue(driver, '#wDesc', '');
  await descField.sendKeys(newDesc);

  await saveSettings(driver);

  await expectText(driver, 'main .sb .t', newTitle);
  await expectText(driver, 'main .sb p', newDesc);
}

/**
 * The home page can be set
 * @param {WebDriver} driver The initialized browser driver
 * @return {void}
 */
export async function canUpdateHomePage(driver) {
  const newPage = await createNewPage(driver, null, 'Home Page', true);

  await openSettings(driver);

  const optionText = `${newPage.title} (${newPage.slug})`;
  const homeField = await expectText(driver, '#home', 'All Pages (default)\n' + optionText);
  const select = new Select(homeField);
  const newPageOption = await expectText(driver, '#home option:nth-child(2)', optionText);
  await select.selectByVisibleText(optionText)
  assert.equal(true, await newPageOption.isSelected())

  await saveSettings(driver);

  await driver.findElement(By.css('main .sb a.t')).click();
  await expectText(driver, 'main > section header h1', newPage.title);
  await expectText(driver, 'main > section > article.uc', newPage.content);
}

/**
 * The page order can be changed
 * @param {WebDriver} driver The initialized browser driver
 * @return {void}
 */
export async function canChangePageOrder(driver) {
  const page1 = await createNewPage(driver, null, 'Page 1', true);
  const page2 = await createNewPage(driver, null, 'Page 2', true);

  await expectText(driver, 'main .sb nav ul li:nth-child(1)', page1.title);
  await expectText(driver, 'main .sb nav ul li:nth-child(2)', page2.title);

  await openSettings(driver);

  const pageOrderTextarea = await expectValue(driver, '#wPo', `${page1.slug}\n${page2.slug}`);
  await pageOrderTextarea.click();
  await pageOrderTextarea.clear();

  await pageOrderTextarea.sendKeys(`${page2.slug}\n${page1.slug}`);

  await saveSettings(driver);

  await expectText(driver, 'main .sb nav ul li:nth-child(1)', page2.title);
  await expectText(driver, 'main .sb nav ul li:nth-child(2)', page1.title);
}

/**
 * The Publish checkbox hides edit buttons
 * @param {WebDriver} driver The initialized browser driver
 * @return {void}
 */
export async function canUsePublishToDisableEditing(driver) {
  const page1 = await createNewPage(driver, null, 'Page 1', true);

  await openSettings(driver);

  const publishCheckbox = await driver.findElement(By.css('#wPub'));
  await publishCheckbox.click();

  await saveSettings(driver);

  await driver.findElement(By.linkText(page1.title)).click();

  await expectMissing(driver, 'main .sb nav a[href="?page=s"]', 'Wiki Settings link should be missing');
  await expectMissing(driver, 'main .sb nav details', 'New Page expander should be missing');
  await expectMissing(driver, 'main > section > header button', 'Edit button should be missing');
}
