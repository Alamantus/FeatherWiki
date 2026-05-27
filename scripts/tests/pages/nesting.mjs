import assert from "assert";
import { until } from "selenium-webdriver";
import { expectMissing, expectText, expectVisible } from "../../tests.mjs";
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

/**
 * Create a page with the given title and parent page id, saving it immediately.
 * Returns the resulting `{ title, slug }`.
 * @param {WebDriver} driver
 * @param {String} title
 * @param {String} parentId
 * @returns {Promise<{title: string, slug: string}>}
 */
async function createChildOfParent(driver, title, parentId) {
  const page = await createNewPage(driver, null, title);

  const parentSelect = new Select(await driver.findElement(By.css('#parent')));
  await parentSelect.selectByValue(parentId);
  await saveOpenedPage(driver);

  return { title: page.title, slug: page.slug };
}

/**
 * Editing a child page and selecting a different parent moves the child to the
 * new parent's branch in the sidebar and updates its breadcrumb.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canReparentChildPage(driver) {
  const parentA = await createNewPage(driver, null, 'Parent A', true);
  const parentB = await createNewPage(driver, null, 'Parent B', true);

  const parentAId = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.slug === target; });'
    + 'return s ? s.id : null;',
    parentA.slug
  );
  const parentBId = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.slug === target; });'
    + 'return s ? s.id : null;',
    parentB.slug
  );
  const child = await createChildOfParent(driver, 'Wandering Child', parentAId);

  await expectText(
    driver,
    `main .sb nav details:has(> summary a[href="?page=${parentA.slug}"]) ul li a`,
    child.title,
    'Child should initially be inside Parent A'
  );

  // Navigate to the child and edit it to change parents
  await driver.findElement(By.css(`main .sb nav a[href="?page=${child.slug}"]`)).click();
  await driver.sleep(150);
  const editButton = await expectText(driver, 'main > section header button', 'Edit');
  await editButton.click();
  await driver.sleep(150);

  const parentSelect = new Select(await driver.findElement(By.css('#parent')));
  await parentSelect.selectByValue(parentBId);
  await saveOpenedPage(driver);

  await expectText(
    driver,
    `main .sb nav details:has(> summary a[href="?page=${parentB.slug}"]) ul li a`,
    child.title,
    'Child should now live under Parent B in the sidebar'
  );
  await expectMissing(
    driver,
    `main .sb nav details:has(> summary a[href="?page=${parentA.slug}"]) ul li a[href="?page=${child.slug}"]`,
    'Child should no longer appear under Parent A'
  );

  const breadcrumb = await driver.findElement(By.css('main > section > header > a'));
  const breadcrumbHref = await breadcrumb.getAttribute('href');
  assert.match(
    breadcrumbHref,
    new RegExp(`\\?page=${parentB.slug}$`),
    `Child breadcrumb should point to Parent B, got ${breadcrumbHref}`
  );
}

/**
 * Deleting a parent page preserves its children and clears their parent
 * reference so they surface at the top level of the sidebar.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function deletingParentOrphansChildren(driver) {
  const parent = await createNewPage(driver, null, 'Parent To Delete', true);
  const parentId = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.slug === target; });'
    + 'return s ? s.id : null;',
    parent.slug
  );
  const child = await createChildOfParent(driver, 'Orphan Child', parentId);

  // Navigate to the parent and delete it
  await driver.findElement(By.css(`main .sb nav a[href="?page=${parent.slug}"]`)).click();
  await driver.sleep(150);
  const editButton = await expectText(driver, 'main > section header button', 'Edit');
  await editButton.click();
  await driver.sleep(150);
  const deleteButton = await expectText(
    driver,
    'main > section form footer button.del',
    'Delete'
  );
  await deleteButton.click();
  await driver.wait(until.alertIsPresent(), 1000);
  const confirm = await driver.switchTo().alert();
  await confirm.accept();
  await driver.sleep(300);

  const remainingIds = await driver.executeScript(
    'return FW.state.p.pages.map(function (p) { return p.id; });'
  );
  assert.strictEqual(
    remainingIds.length,
    1,
    `Child should still exist after parent deletion, got ${JSON.stringify(remainingIds)}`
  );

  const childParent = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.slug === target; });'
    + 'return s ? (s.parent ?? null) : null;',
    child.slug
  );
  assert.ok(
    childParent == null,
    `Orphaned child should have no parent, got ${JSON.stringify(childParent)}`
  );

  await expectVisible(
    driver,
    `main .sb nav ul > li > a[href="?page=${child.slug}"]`,
    'Orphaned child should now appear at the top level of the sidebar'
  );
}

/**
 * A child page nested three levels deep renders a full breadcrumb trail
 * showing each ancestor in order.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function deepNestingRendersFullBreadcrumb(driver) {
  const grandparent = await createNewPage(driver, null, 'Grandparent Page', true);
  const grandparentId = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.slug === target; });'
    + 'return s ? s.id : null;',
    grandparent.slug
  );
  const parent = await createChildOfParent(driver, 'Parent Page', grandparentId);
  const parentId = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.slug === target; });'
    + 'return s ? s.id : null;',
    parent.slug
  );
  const child = await createChildOfParent(driver, 'Deep Child', parentId);

  // Navigate to the deep child page
  await driver.findElement(By.css(`main .sb nav a[href="?page=${child.slug}"]`)).click();
  await driver.sleep(150);

  const breadcrumbLinks = await driver.findElements(
    By.css('main > section > header > a')
  );
  const hrefs = await Promise.all(breadcrumbLinks.map(a => a.getAttribute('href')));
  const texts = await Promise.all(breadcrumbLinks.map(a => a.getText()));

  assert.strictEqual(
    breadcrumbLinks.length,
    2,
    `Breadcrumb should include two ancestor links for a three-level-deep page, got ${breadcrumbLinks.length}`
  );
  assert.match(
    hrefs[0],
    new RegExp(`\\?page=${grandparent.slug}$`),
    `First breadcrumb link should point to the grandparent, got ${hrefs[0]}`
  );
  assert.match(
    hrefs[1],
    new RegExp(`\\?page=${parent.slug}$`),
    `Second breadcrumb link should point to the parent, got ${hrefs[1]}`
  );
  assert.deepStrictEqual(
    texts,
    [grandparent.title, parent.title],
    `Breadcrumb link text should list ancestors top-down, got ${JSON.stringify(texts)}`
  );
}
