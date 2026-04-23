import { By, WebDriver } from "selenium-webdriver";
import { expectText } from "../../tests.mjs";

/**
 * Click the Wiki Settings link in the side bar
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function openSettings(driver) {
  const settingsLink = await expectText(driver, 'main > .sb nav p a', 'Wiki Settings');
  await settingsLink.click();
  await expectText(driver, 'main > section > header > h1', 'Wiki Settings');
}

/**
 * Click the save button on the settings page
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function saveSettings(driver) {
  const submitButton = await driver.findElement(By.css('main > section form button[type="submit"]'));
  await submitButton.click();
  await driver.sleep(150);
}
