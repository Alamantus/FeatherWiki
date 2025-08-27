import { expectText, expectValue } from "../tests.mjs";
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
