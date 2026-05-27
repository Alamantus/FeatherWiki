import assert from "assert";
import { By, Key, until, WebDriver } from "selenium-webdriver";
import { expectMissing, expectText, expectVisible } from "../tests.mjs";
import { createNewPage } from "./pages/index.mjs";

/**
 * Install a JS hook that captures anchor-based downloads without actually
 * triggering the browser's download UI. Hook survives until navigation.
 *
 * @param {WebDriver} driver
 * @returns {Promise<void>}
 */
async function installDownloadSpy(driver) {
  await driver.executeScript(
    'window.__downloads = [];'
    + 'var origClick = HTMLAnchorElement.prototype.click;'
    + 'HTMLAnchorElement.prototype.click = function () {'
    +   'if (this.hasAttribute("download")) {'
    +     'window.__downloads.push({'
    +       'href: this.getAttribute("href"),'
    +       'download: this.getAttribute("download"),'
    +     '});'
    +     'return;'
    +   '}'
    +   'return origClick.call(this);'
    + '};'
  );
}

/**
 * Read captured downloads after `installDownloadSpy` has been installed
 *
 * @param {WebDriver} driver
 * @returns {Promise<Array<{href: string, download: string}>>}
 */
async function getCapturedDownloads(driver) {
  return await driver.executeScript('return window.__downloads || [];');
}

/**
 * Locate one of the save buttons in the sidebar by its visible label
 *
 * @param {WebDriver} driver
 * @param {String} label e.g. "Save Wiki to Server" or "Save Wiki Locally"
 * @returns {Promise<import('selenium-webdriver').WebElement>}
 */
async function findSaveButton(driver, label) {
  return await driver.findElement(
    By.xpath(`//main/div[contains(@class,'sb')]//button[normalize-space(text())='${label}']`)
  );
}

/**
 * Editing a saved wiki surfaces the "wiki has changed" banner and flags the
 * server save button with the `.chg` class. A freshly loaded wiki shows neither.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function changedIndicatorReflectsEdits(driver) {
  await expectMissing(
    driver,
    'main > div.sb > div > button.chg',
    'Fresh wiki should not flag any save button as changed'
  );
  const initialBanner = await driver.findElements(
    By.xpath("//main/div[contains(@class,'sb')]/div[normalize-space(text())='Wiki has changed!']")
  );
  assert.strictEqual(
    initialBanner.length,
    0,
    'Fresh wiki should not show the "Wiki has changed!" banner'
  );

  await createNewPage(driver, null, 'Triggering Page', true);

  await expectVisible(
    driver,
    'main > div.sb > div > button.chg',
    'Editing should flag a save button as changed'
  );
  const putSaveButton = await findSaveButton(driver, 'Save Wiki to Server');
  const putClass = (await putSaveButton.getAttribute('class')) ?? '';
  assert.ok(
    putClass.split(/\s+/).includes('chg'),
    'The "Save Wiki to Server" button should get the .chg class when the wiki has unsaved changes'
  );

  await expectText(
    driver,
    'main > div.sb > div',
    'Wiki has changed!',
    'The "Wiki has changed!" banner should render above the save buttons when edits are unsaved'
  );
}

/**
 * Clicking "Save Wiki to Server" sends a PUT, shows the "Saved" notification,
 * and clears the changed indicator.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canPutSaveWikiToServer(driver) {
  await createNewPage(driver, null, 'Page To Persist', true);

  const putSaveButton = await findSaveButton(driver, 'Save Wiki to Server');
  await putSaveButton.click();

  const notification = await driver.wait(
    until.elementLocated(By.css('.notis .noti span[role=alert]')),
    3000,
    'Expected a save notification to appear after PUT save'
  );
  const notificationText = await notification.getText();
  assert.strictEqual(
    notificationText,
    'Saved',
    `Expected "Saved" notification, got "${notificationText}"`
  );

  await driver.wait(async () => {
    const changed = await driver.executeScript('return FW.state.changed;');
    return changed === false;
  }, 3000, 'state.changed should clear after successful PUT save');

  await expectMissing(
    driver,
    'main > div.sb > div > button.chg',
    'No save button should carry the .chg class after a successful PUT save'
  );
}

/**
 * Clicking "Save Wiki Locally" creates and activates a download anchor whose
 * href is the current wiki as a data URL, using the expected filename.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canSaveWikiLocally(driver) {
  await installDownloadSpy(driver);

  await createNewPage(driver, null, 'Locally Saved Page', true);
  // Re-install spy because createNewPage does not navigate, but safety first
  await installDownloadSpy(driver);

  const localSaveButton = await findSaveButton(driver, 'Save Wiki Locally');
  await localSaveButton.click();
  await driver.sleep(200);

  const downloads = await getCapturedDownloads(driver);
  assert.strictEqual(
    downloads.length,
    1,
    `Expected exactly one download click to be captured, got ${downloads.length}`
  );
  const [download] = downloads;
  assert.ok(
    download.href.startsWith('data:text/html;charset=utf-8,'),
    `Download href should be a text/html data URL, got "${download.href.substring(0, 60)}..."`
  );
  assert.strictEqual(
    download.download,
    'index.html',
    `Download filename should be "index.html" when served from the root, got "${download.download}"`
  );
}

/**
 * Pressing Ctrl+S triggers a PUT save when the server supports it
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function ctrlSTriggersPutSave(driver) {
  await createNewPage(driver, null, 'Hotkey Page', true);

  // Focus an element that is not the editor so Ctrl+S hits the document handler
  // instead of any input-specific behavior.
  await driver.findElement(By.css('main > div.sb > span.db > a.t')).click();
  await driver.sleep(100);

  await driver.actions().keyDown(Key.CONTROL).sendKeys('s').keyUp(Key.CONTROL).perform();

  const notification = await driver.wait(
    until.elementLocated(By.css('.notis .noti span[role=alert]')),
    3000,
    'Expected a "Saved" notification after Ctrl+S'
  );
  const notificationText = await notification.getText();
  assert.strictEqual(
    notificationText,
    'Saved',
    `Ctrl+S should trigger PUT save and show "Saved", got "${notificationText}"`
  );

  await driver.wait(async () => {
    const changed = await driver.executeScript('return FW.state.changed;');
    return changed === false;
  }, 3000, 'state.changed should clear after Ctrl+S PUT save');
}

/**
 * Pressing Ctrl+Shift+S forces a local download even when the server supports PUT save
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function ctrlShiftSTriggersLocalSave(driver) {
  await installDownloadSpy(driver);

  await createNewPage(driver, null, 'Shift Hotkey Page', true);
  await installDownloadSpy(driver);

  // Focus an element outside form inputs so Ctrl+Shift+S reaches the document handler
  await driver.findElement(By.css('main > div.sb > span.db > a.t')).click();
  await driver.sleep(100);

  await driver.actions()
    .keyDown(Key.CONTROL)
    .keyDown(Key.SHIFT)
    .sendKeys('s')
    .keyUp(Key.SHIFT)
    .keyUp(Key.CONTROL)
    .perform();
  await driver.sleep(300);

  const downloads = await getCapturedDownloads(driver);
  assert.strictEqual(
    downloads.length,
    1,
    `Expected Ctrl+Shift+S to trigger exactly one local download, got ${downloads.length}`
  );
  assert.ok(
    downloads[0].href.startsWith('data:text/html;charset=utf-8,'),
    'Ctrl+Shift+S download should produce a text/html data URL'
  );

  // PUT save should NOT have been triggered — no "Saved" notification should appear
  await driver.sleep(300);
  const notifications = await driver.findElements(By.css('.notis .noti'));
  assert.strictEqual(
    notifications.length,
    0,
    'Ctrl+Shift+S should trigger local save, not a PUT save with "Saved" notification'
  );
}
