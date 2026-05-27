import assert from "assert";
import { By, until, WebDriver } from "selenium-webdriver";
import { expectText, expectValue, expectVisible } from "../../tests.mjs";
import { openSettings, saveSettings } from "./index.mjs";

/**
 * Replace the full content of a textarea field with the provided value
 * @param {WebDriver} driver
 * @param {String} cssSelector
 * @param {String} value
 * @returns {Promise<void>}
 */
async function replaceTextareaValue(driver, cssSelector, value) {
  const field = await driver.findElement(By.css(cssSelector));
  await field.click();
  await field.clear();
  if (value.length > 0) await field.sendKeys(value);
}

/**
 * Saving custom CSS writes a <style id=c> element into document head and persists
 * on state.c. Clearing the field removes both.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canAddAndClearCustomCss(driver) {
  await openSettings(driver);

  const css = 'body { --custom-css-test: "applied"; }';
  await replaceTextareaValue(driver, '#wCss', css);
  await saveSettings(driver);

  const styleElementText = await driver.executeScript(
    'return document.getElementById("c")?.innerHTML ?? null'
  );
  assert.strictEqual(
    styleElementText,
    css,
    `Saved custom CSS should be injected into <style id=c>, got ${styleElementText}`
  );
  const stateC = await driver.executeScript('return FW.state.c;');
  assert.strictEqual(stateC, css, `state.c should retain the saved custom CSS, got ${stateC}`);

  await replaceTextareaValue(driver, '#wCss', '');
  await saveSettings(driver);

  const removedStyleElement = await driver.executeScript('return document.getElementById("c");');
  assert.strictEqual(
    removedStyleElement,
    null,
    'The <style id=c> element should be removed from the document head when custom CSS is cleared'
  );
  const clearedStateC = await driver.executeScript('return FW.state.c;');
  assert.ok(
    clearedStateC == null || clearedStateC === '',
    `state.c should be cleared after removing custom CSS, got ${JSON.stringify(clearedStateC)}`
  );
}

/**
 * Saving custom JS shows the reload alert and persists the content on state.j.
 * Clearing the field removes state.j on save.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canAddAndClearCustomJs(driver) {
  await openSettings(driver);

  const js = 'window.__customJsFlag = "configured";';
  await replaceTextareaValue(driver, '#wJs', js);
  await saveSettings(driver);

  await driver.wait(until.alertIsPresent(), 1000);
  const reloadAlert = await driver.switchTo().alert();
  const reloadAlertText = await reloadAlert.getText();
  assert.strictEqual(
    reloadAlertText,
    'You must save & reload to run your JavaScript',
    `Saving custom JS should prompt the reload alert, got "${reloadAlertText}"`
  );
  await reloadAlert.accept();
  await driver.sleep(150);

  const stateJ = await driver.executeScript('return FW.state.j;');
  assert.strictEqual(stateJ, js, `state.j should retain the saved custom JS, got ${stateJ}`);

  // Clear and save again — no alert should fire because the new (empty) content
  // leaves state.j unset rather than different.
  await openSettings(driver);
  await replaceTextareaValue(driver, '#wJs', '');
  await saveSettings(driver);

  const clearedStateJ = await driver.executeScript('return FW.state.j;');
  assert.ok(
    clearedStateJ == null || clearedStateJ === '',
    `state.j should be cleared after removing custom JS, got ${JSON.stringify(clearedStateJ)}`
  );
}

/**
 * Custom JS entered via settings actually runs after the wiki is saved and
 * reopened. We PUT-save to develop/put-save.html and navigate to it, then
 * verify a window flag set by the custom JS is present after the reload.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function customJsRunsAfterReloadFromServer(driver) {
  await openSettings(driver);

  const js = 'window.__customJsRan = true;';
  await replaceTextareaValue(driver, '#wJs', js);
  await saveSettings(driver);

  await driver.wait(until.alertIsPresent(), 1000);
  const reloadAlert = await driver.switchTo().alert();
  await reloadAlert.accept();
  await driver.sleep(150);

  const putSaveButton = await driver.findElement(
    By.xpath("//main/div[contains(@class,'sb')]//button[normalize-space(text())='Save Wiki to Server']")
  );
  await putSaveButton.click();
  await driver.wait(
    until.elementLocated(By.css('.notis .noti span[role=alert]')),
    3000,
    'Expected "Saved" notification before attempting to reload the PUT-saved wiki'
  );

  await driver.navigate().to('http://localhost:3000/develop/put-save.html');
  await driver.sleep(400);

  const flag = await driver.executeScript('return window.__customJsRan;');
  assert.strictEqual(
    flag,
    true,
    `window.__customJsRan should be true after reloading the PUT-saved wiki, got ${JSON.stringify(flag)}`
  );

  const parsedStateJ = await driver.executeScript('return FW.state.j;');
  assert.strictEqual(
    parsedStateJ,
    js,
    `After reload FW.parseJs should recover the saved JS as state.j, got ${parsedStateJ}`
  );
}

/**
 * Custom head content is persisted on state.p.head, stored with angle braces
 * escaped to prevent stray script injection from round-tripping. Clearing the
 * field removes state.p.head on save.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canAddAndClearCustomHeadContent(driver) {
  await openSettings(driver);

  const head = '<meta name="custom-head-test" content="ok">';
  await replaceTextareaValue(driver, '#wHead', head);
  await saveSettings(driver);

  const stored = await driver.executeScript('return FW.state.p.head;');
  assert.strictEqual(
    stored,
    '&lt;meta name="custom-head-test" content="ok"&gt;',
    `Custom head should be stored with <,> escaped, got ${stored}`
  );

  await openSettings(driver);
  await expectValue(driver, '#wHead', head);

  await replaceTextareaValue(driver, '#wHead', '');
  await saveSettings(driver);

  const cleared = await driver.executeScript('return FW.state.p.head;');
  assert.ok(
    cleared == null || cleared === '',
    `state.p.head should be removed after clearing the custom head field, got ${JSON.stringify(cleared)}`
  );
}

/**
 * The Include Static HTML checkbox toggles state.p.static on save.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canToggleIncludeStaticHtml(driver) {
  await openSettings(driver);

  const initial = await driver.executeScript('return FW.state.p.static;');
  assert.ok(
    !initial,
    `Fresh wiki should not have static export enabled, got ${JSON.stringify(initial)}`
  );

  const checkbox = await expectVisible(driver, '#wOut');
  await checkbox.click();
  await saveSettings(driver);

  const enabled = await driver.executeScript('return FW.state.p.static;');
  assert.strictEqual(
    enabled,
    true,
    `state.p.static should be true after enabling the Include Static HTML checkbox, got ${JSON.stringify(enabled)}`
  );

  await openSettings(driver);
  const checkboxAgain = await expectVisible(driver, '#wOut');
  const checkedAttr = await checkboxAgain.getAttribute('checked');
  assert.ok(
    checkedAttr !== null,
    'Include Static HTML checkbox should render checked after save'
  );
  await checkboxAgain.click();
  await saveSettings(driver);

  const disabled = await driver.executeScript('return FW.state.p.static;');
  assert.strictEqual(
    disabled,
    false,
    `state.p.static should be false after disabling the Include Static HTML checkbox, got ${JSON.stringify(disabled)}`
  );
}

/**
 * Construct a fake Feather Wiki HTML file in the browser using the running
 * instance's own `FW.gen`, then monkey-patch `FW.upload` so the next upload
 * call resolves with that constructed file instead of opening a file picker.
 *
 * @param {WebDriver} driver
 * @param {Object} p The `p` (wiki data) payload that should be embedded
 * @returns {Promise<void>}
 */
async function stageImportedWikiFile(driver, p) {
  await driver.executeScript(
    'var targetP = arguments[0];'
    + 'var stateForGen = Object.assign({}, FW.state, { p: targetP, c: "", j: "" });'
    + 'var html = FW.gen(stateForGen);'
    + 'var file = new File([html], "imported.html", { type: "text/html" });'
    + 'FW.upload = function (mime, cb) { cb(file); };',
    p
  );
}

/**
 * Uploading a Feather Wiki file via the Import button replaces state with the
 * file's contents, refreshes the sidebar, and surfaces the "Wiki Loaded"
 * notification.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canImportFeatherWikiFile(driver) {
  await openSettings(driver);

  const importedWikiTitle = 'Imported Wiki Title';
  const importedPageName = 'Imported Page';
  const importedPageSlug = 'imported_page';
  const importedPageContent = 'Hello from the imported wiki';
  await stageImportedWikiFile(driver, {
    name: importedWikiTitle,
    desc: 'Came from the import test',
    pages: [{
      id: 'import_id',
      name: importedPageName,
      slug: importedPageSlug,
      content: `<p>${importedPageContent}</p>`,
      cd: 1700000000000,
    }],
    img: {},
  });

  const importButton = await driver.findElement(
    By.xpath("//button[starts-with(normalize-space(text()), 'Import')]")
  );
  await importButton.click();

  const notification = await driver.wait(
    until.elementLocated(By.css('.notis .noti span[role=alert]')),
    3000,
    'Expected the "Wiki Loaded" notification after a successful import'
  );
  const notificationText = await notification.getText();
  assert.strictEqual(
    notificationText,
    'Wiki Loaded',
    `Import should display "Wiki Loaded", got "${notificationText}"`
  );

  const titleAfter = await driver.executeScript('return FW.state.p.name;');
  assert.strictEqual(
    titleAfter,
    importedWikiTitle,
    `state.p.name should match the imported wiki's title, got "${titleAfter}"`
  );

  await expectText(driver, 'main > .sb .t', importedWikiTitle);
  await expectVisible(
    driver,
    `main .sb nav a[href="?page=${importedPageSlug}"]`,
    'Imported page should appear in the sidebar after import'
  );

  const importedPageLink = await driver.findElement(
    By.css(`main .sb nav a[href="?page=${importedPageSlug}"]`)
  );
  await importedPageLink.click();
  await expectText(driver, 'main > section header h1', importedPageName);
  await expectText(driver, 'main > section > article.uc', importedPageContent);
}

/**
 * Uploading an HTML file that has no Feather Wiki data payload surfaces the
 * "Could not find Feather Wiki data." alert and leaves state untouched.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function importRejectsNonFeatherWikiFile(driver) {
  await openSettings(driver);

  const originalName = await driver.executeScript('return FW.state.p.name;');

  await driver.executeScript(
    'var file = new File(["<html><body>Not a Feather Wiki file</body></html>"], "bogus.html", { type: "text/html" });'
    + 'FW.upload = function (mime, cb) { cb(file); };'
  );

  const importButton = await driver.findElement(
    By.xpath("//button[starts-with(normalize-space(text()), 'Import')]")
  );
  await importButton.click();

  await driver.wait(until.alertIsPresent(), 1000);
  const alert = await driver.switchTo().alert();
  const alertText = await alert.getText();
  assert.match(
    alertText,
    /Could not find.+?data/,
    `Rejecting a non-Feather-Wiki file should alert, got "${alertText}"`
  );
  await alert.accept();
  await driver.sleep(150);

  const nameAfter = await driver.executeScript('return FW.state.p.name;');
  assert.strictEqual(
    nameAfter,
    originalName,
    `state.p.name should be unchanged after a failed import, got "${nameAfter}"`
  );
}

