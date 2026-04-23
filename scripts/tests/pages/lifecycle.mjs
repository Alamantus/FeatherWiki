import assert from "assert";
import { By, until, WebDriver } from "selenium-webdriver";
import { expectMissing, expectText, expectVisible } from "../../tests.mjs";
import { createNewPage, saveOpenedPage } from "./index.mjs";

/**
 * Open the edit view for a previously saved page that is currently displayed
 * @param {WebDriver} driver
 * @returns {Promise<void>}
 */
async function clickEditButton(driver) {
  const editButton = await expectText(driver, 'main > section header button', 'Edit');
  await editButton.click();
  await expectText(driver, 'main > section header h1', 'Edit Page');
}

/**
 * Clicking Delete and accepting the confirm prompt removes the page from the wiki
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canDeletePageAfterConfirm(driver) {
  const page = await createNewPage(driver, null, 'Doomed Page', true);

  await clickEditButton(driver);
  const deleteButton = await expectText(
    driver,
    'main > section form footer button.del',
    'Delete'
  );
  await deleteButton.click();

  await driver.wait(until.alertIsPresent(), 1000);
  const confirm = await driver.switchTo().alert();
  const confirmText = await confirm.getText();
  assert.match(
    confirmText,
    /Delete this page/,
    `Delete confirm should warn before deletion, got "${confirmText}"`
  );
  await confirm.accept();
  await driver.sleep(300);

  await expectMissing(
    driver,
    `main .sb nav a[href="?page=${page.slug}"]`,
    'Deleted page should no longer appear in the sidebar'
  );
  const pageIds = await driver.executeScript(
    'return FW.state.p.pages.map(function (p) { return p.id; });'
  );
  assert.ok(
    Array.isArray(pageIds) && pageIds.length === 0,
    `Deleted page should be removed from state, but state still has ${JSON.stringify(pageIds)}`
  );
}

/**
 * Dismissing the Delete confirm prompt keeps the page intact
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function dismissingDeletePromptKeepsPage(driver) {
  const page = await createNewPage(driver, null, 'Kept Page', true);

  await clickEditButton(driver);
  const deleteButton = await expectText(
    driver,
    'main > section form footer button.del',
    'Delete'
  );
  await deleteButton.click();

  await driver.wait(until.alertIsPresent(), 1000);
  const confirm = await driver.switchTo().alert();
  await confirm.dismiss();
  await driver.sleep(200);

  await expectText(driver, 'main > section header h1', 'Edit Page');
  await expectVisible(
    driver,
    `main .sb nav a[href="?page=${page.slug}"]`,
    'Page should still exist in sidebar after dismissing the delete prompt'
  );
}

/**
 * Clicking Cancel while editing prompts a warning and returns to the display view when confirmed
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canCancelEditReturningToDisplay(driver) {
  const page = await createNewPage(driver, null, 'Cancel Test Page', true);

  await clickEditButton(driver);
  const textarea = await driver.findElement(By.css('#e .ed-uc'));
  await driver.wait(until.elementIsVisible(textarea));
  await textarea.click();
  await textarea.clear();
  await textarea.sendKeys('Pending edits that should be discarded');

  const cancelButton = await driver.findElement(
    By.xpath("//form//footer//button[normalize-space(text())='Cancel']")
  );
  await cancelButton.click();

  await driver.wait(until.alertIsPresent(), 1000);
  const confirm = await driver.switchTo().alert();
  const confirmText = await confirm.getText();
  assert.match(
    confirmText,
    /Lose unsaved changes\?/,
    `Cancel should warn about unsaved changes, got "${confirmText}"`
  );
  await confirm.accept();
  await driver.sleep(200);

  await expectText(driver, 'main > section header h1', page.title);
  await expectText(driver, 'main > section > article.uc', page.content);
  await expectVisible(
    driver,
    'main > section header button',
    'Edit button should be visible after returning to display'
  );
}

/**
 * Dismissing the Cancel warning keeps the user in the editor with pending edits intact
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function dismissingCancelPromptKeepsEditing(driver) {
  await createNewPage(driver, null, 'Keep Editing Page', true);

  await clickEditButton(driver);
  const textarea = await driver.findElement(By.css('#e .ed-uc'));
  await driver.wait(until.elementIsVisible(textarea));
  await textarea.click();
  await textarea.clear();
  const pending = 'Still working on this change';
  await textarea.sendKeys(pending);

  const cancelButton = await driver.findElement(
    By.xpath("//form//footer//button[normalize-space(text())='Cancel']")
  );
  await cancelButton.click();

  await driver.wait(until.alertIsPresent(), 1000);
  const confirm = await driver.switchTo().alert();
  await confirm.dismiss();
  await driver.sleep(200);

  await expectText(driver, 'main > section header h1', 'Edit Page');
  const currentHtml = await driver.executeScript(
    'return document.querySelector("#e .ed-uc").innerHTML'
  );
  assert.ok(
    currentHtml.includes(pending),
    `Editor should retain pending edits after dismissing cancel, got "${currentHtml}"`
  );
}
