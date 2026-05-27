import assert from "assert";
import { By, until, WebDriver } from "selenium-webdriver";
import { expectMissing, expectText, expectValue, expectVisible } from "../../tests.mjs";
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

/**
 * Saving an edited page with a slug that already belongs to another page shows
 * the slugExists alert and keeps the editor open.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function editingPageToDuplicateSlugShowsAlert(driver) {
  const first = await createNewPage(driver, null, 'First Page', true);
  const second = await createNewPage(driver, null, 'Second Page', true);

  await clickEditButton(driver);
  const slugField = await expectValue(driver, 'main > section header #slug', second.slug);
  await slugField.clear();
  await driver.sleep(100);
  await slugField.sendKeys(first.slug);

  await saveOpenedPage(driver);

  await driver.wait(until.alertIsPresent(), 1000);
  const slugAlert = await driver.switchTo().alert();
  const slugAlertText = await slugAlert.getText();
  assert.match(
    slugAlertText,
    new RegExp(`A page with the slug "?${first.slug}"? already exists`),
    `Expected slugExists alert referencing "${first.slug}", got "${slugAlertText}"`
  );
  await slugAlert.accept();
  await driver.sleep(150);

  await expectText(
    driver,
    'main > section header h1',
    'Edit Page',
    'Editor should remain open after the duplicate slug is rejected'
  );
  const links = await driver.findElements(
    By.css(`main .sb nav a[href="?page=${first.slug}"]`)
  );
  assert.strictEqual(
    links.length,
    1,
    `Only the original page should own slug "${first.slug}" in the sidebar, found ${links.length}`
  );
}

/**
 * The page title input enforces minlength=2, preventing submission when the
 * title is shorter than two characters.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function savingPageWithShortTitleIsBlocked(driver) {
  const page = await createNewPage(driver, null, 'Valid Title Page', true);

  await clickEditButton(driver);
  const titleField = await expectValue(driver, '#name', page.title);
  await titleField.clear();
  await driver.sleep(50);
  await titleField.sendKeys('X');

  const saveButton = await driver.findElement(
    By.css('main > section form footer button[type="submit"]')
  );
  await saveButton.click();
  await driver.sleep(150);

  const validity = await driver.executeScript(
    'var el = document.getElementById("name");'
    + 'return { valid: el.validity.valid, tooShort: el.validity.tooShort };'
  );
  assert.strictEqual(validity.valid, false, 'Title input should be invalid when under minlength');
  assert.strictEqual(
    validity.tooShort,
    true,
    'Title input should report tooShort when below 2 characters'
  );

  await expectText(
    driver,
    'main > section header h1',
    'Edit Page',
    'Editor should stay open when short title blocks submission'
  );
  const stateName = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.slug === target; });'
    + 'return s ? s.name : null;',
    page.slug
  );
  assert.strictEqual(
    stateName,
    page.title,
    'Stored page title should be unchanged when the submit is blocked'
  );
}

/**
 * The page slug input enforces minlength=2, preventing submission when the
 * slug is shorter than two characters.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function savingPageWithShortSlugIsBlocked(driver) {
  const page = await createNewPage(driver, null, 'Valid Slug Page', true);

  await clickEditButton(driver);
  const slugField = await expectValue(driver, '#slug', page.slug);
  await slugField.clear();
  await driver.sleep(50);
  await slugField.sendKeys('x');

  const saveButton = await driver.findElement(
    By.css('main > section form footer button[type="submit"]')
  );
  await saveButton.click();
  await driver.sleep(150);

  const validity = await driver.executeScript(
    'var el = document.getElementById("slug");'
    + 'return { valid: el.validity.valid, tooShort: el.validity.tooShort };'
  );
  assert.strictEqual(validity.valid, false, 'Slug input should be invalid when under minlength');
  assert.strictEqual(
    validity.tooShort,
    true,
    'Slug input should report tooShort when below 2 characters'
  );

  await expectText(
    driver,
    'main > section header h1',
    'Edit Page',
    'Editor should stay open when short slug blocks submission'
  );
  const stateSlug = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.name === target; });'
    + 'return s ? s.slug : null;',
    page.title
  );
  assert.strictEqual(
    stateSlug,
    page.slug,
    'Stored page slug should be unchanged when the submit is blocked'
  );
}

/**
 * The "Slugify Title" button regenerates the slug field from the current title
 * value, applying FW.slug's special-character transformation rules.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function slugifyTitleButtonRegeneratesSlug(driver) {
  await createNewPage(driver, null, 'Original Title', true);

  await clickEditButton(driver);
  const newTitle = 'Hello, World! (Greetings)';
  await driver.executeScript(
    'var el = document.getElementById("name");'
    + 'el.value = arguments[0];'
    + 'el.dispatchEvent(new Event("change", { bubbles: true }));',
    newTitle
  );
  await driver.sleep(150);

  const slugifyButton = await driver.findElement(
    By.xpath("//form/header//button[normalize-space(text())='Slugify Title']")
  );
  await slugifyButton.click();
  await driver.sleep(200);

  const expectedSlug = await driver.executeScript(
    'return FW.slug(arguments[0]);',
    newTitle
  );
  await expectValue(
    driver,
    '#slug',
    expectedSlug,
    `Slugify Title should regenerate slug from the current title field, expected "${expectedSlug}"`
  );

  await saveOpenedPage(driver);
  const updatedSlug = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.name === target; });'
    + 'return s ? s.slug : null;',
    newTitle
  );
  assert.strictEqual(
    updatedSlug,
    expectedSlug,
    `Saved page should use the slugified slug "${expectedSlug}", got "${updatedSlug}"`
  );
}
