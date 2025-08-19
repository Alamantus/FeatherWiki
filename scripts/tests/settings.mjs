import { expectText, expectValue } from "../tests.mjs";
import { Browser, Builder, By, WebDriver } from "selenium-webdriver";

// export default async function run() {
//   const driver = await new Builder().forBrowser(Browser.FIREFOX).build();
//   await driver.get('http://localhost:3000');

//   await canUpdateTitleAndDescription(driver);
// }

/**
 * The title and description of the wiki can be set from the Wiki Settings
 * @param {WebDriver} driver The initialized browser driver
 */
export async function canUpdateTitleAndDescription(driver) {
  const settingsLink = await expectText(driver, 'main > .sb nav p a', 'Wiki Settings');
  await settingsLink.click();
  await expectText(driver, 'main > section > header > h1', 'Wiki Settings');

  const newTitle = 'Feather Wiki Test';
  const titleField = await expectValue(driver, '#wTitle', 'New Wiki');
  await titleField.clear();
  await titleField.sendKeys(newTitle);

  const newDesc = 'A wiki for running test cases for Feather Wiki';
  const descField = await expectValue(driver, '#wDesc', '');
  await descField.sendKeys(newDesc);

  let submitButton = await driver.findElement(By.css('main > section form button[type="submit"]'));
  await submitButton.click();

  await expectText(driver, 'main .sb .t', newTitle);
  await expectText(driver, 'main .sb p', newDesc);
}
