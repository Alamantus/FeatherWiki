import assert from "assert";
import { By, Select, WebDriver } from "selenium-webdriver";
import { expectMissing, expectText, expectVisible } from "../tests.mjs";
import { createNewPage, saveOpenedPage } from "./pages/index.mjs";

/**
 * Clicking the sidebar toggle flips state.sb and updates the nav's hidden
 * class + button label accordingly. Uses a JS click because the `.sbt` button
 * is hidden on desktop-width viewports (the toggle is intended for narrow
 * screens) but its behavior is the same.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canToggleSidebar(driver) {
  // `.sbt` has `display: none` on desktop viewports (the toggle is only visible
  // on narrow screens), so read text via JS instead of `getText()` which
  // returns empty for hidden elements.
  const snapshot = () => driver.executeScript(
    'var nav = document.querySelector("main > div.sb > nav");'
    + 'var btn = document.querySelector("main > div.sb > button.sbt");'
    + 'return { sb: FW.state.sb, navClass: nav.className, btnText: btn.textContent.trim() };'
  );

  const initial = await snapshot();
  assert.strictEqual(
    initial.sb,
    false,
    `Fresh wiki should start with sidebar collapsed (sb=false), got ${JSON.stringify(initial)}`
  );
  assert.ok(
    initial.navClass.split(/\s+/).includes('n'),
    `Nav should start with the "n" class that hides it on narrow viewports, got "${initial.navClass}"`
  );
  assert.strictEqual(
    initial.btnText,
    'Show Menu',
    `Toggle button should say "Show Menu" when sidebar is collapsed, got "${initial.btnText}"`
  );

  await driver.executeScript('document.querySelector("main > div.sb > button.sbt").click();');
  await driver.sleep(150);

  const expanded = await snapshot();
  assert.strictEqual(expanded.sb, true, 'Clicking the toggle should set state.sb = true');
  assert.ok(
    !expanded.navClass.split(/\s+/).includes('n'),
    `Nav should not carry the "n" class while expanded, got "${expanded.navClass}"`
  );
  assert.strictEqual(
    expanded.btnText,
    'Hide Menu',
    `Toggle button should say "Hide Menu" while expanded, got "${expanded.btnText}"`
  );

  await driver.executeScript('document.querySelector("main > div.sb > button.sbt").click();');
  await driver.sleep(150);

  const collapsedAgain = await snapshot();
  assert.strictEqual(
    collapsedAgain.sb,
    false,
    'Clicking the toggle again should collapse the sidebar (sb=false)'
  );
  assert.ok(
    collapsedAgain.navClass.split(/\s+/).includes('n'),
    `Nav should regain the "n" class after a second toggle, got "${collapsedAgain.navClass}"`
  );
}

/**
 * The Recent tab lists pages in modification-descending order, with the most
 * recently edited at the top and rendered timestamps present.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function recentTabShowsMostRecentlyModifiedFirst(driver) {
  const first = await createNewPage(driver, null, 'First Page', true);
  const second = await createNewPage(driver, null, 'Second Page', true);
  const third = await createNewPage(driver, null, 'Third Page', true);

  const recentTab = await driver.findElement(
    By.xpath("//main/div[contains(@class,'sb')]//nav//div[contains(@class,'tabs')]/button[normalize-space(text())='Recent']")
  );
  await recentTab.click();
  await driver.sleep(150);

  const items = await driver.findElements(By.css('main .sb nav ul li a'));
  const titles = await Promise.all(items.map(a => a.getText()));
  assert.deepStrictEqual(
    titles,
    [third.title, second.title, first.title],
    `Recent tab should list pages newest-first, got ${JSON.stringify(titles)}`
  );

  const timestampParas = await driver.findElements(By.css('main .sb nav ul li p.h'));
  assert.strictEqual(
    timestampParas.length,
    titles.length,
    `Each recent entry should render a timestamp, expected ${titles.length}, got ${timestampParas.length}`
  );
  const timestampTexts = await Promise.all(timestampParas.map(p => p.getText()));
  for (const text of timestampTexts) {
    assert.ok(
      text.length > 0,
      `Timestamp text should not be empty, got ${JSON.stringify(timestampTexts)}`
    );
  }
}

/**
 * Pages marked "Hide Page" are excluded from the sidebar tree but remain
 * reachable by direct URL.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function hidePageExcludesFromSidebar(driver) {
  const visible = await createNewPage(driver, null, 'Visible Page', true);

  const hidden = await createNewPage(driver, null, 'Hidden Page');
  const hideCheckbox = await driver.findElement(By.css('#hide'));
  await hideCheckbox.click();
  await saveOpenedPage(driver);

  await expectVisible(
    driver,
    `main .sb nav ul > li > a[href="?page=${visible.slug}"]`,
    'The non-hidden page should still appear in the sidebar'
  );
  await expectMissing(
    driver,
    `main .sb nav ul > li > a[href="?page=${hidden.slug}"]`,
    'The hidden page should be omitted from the sidebar tree'
  );

  // Navigate via a synthetic in-app link click so the in-memory wiki state
  // survives (a full `driver.get()` reload would wipe the pages back to the
  // freshly served build file).
  await driver.executeScript(
    'var a = document.createElement("a");'
    + 'a.href = "?page=" + arguments[0];'
    + 'document.body.appendChild(a);'
    + 'a.click();'
    + 'document.body.removeChild(a);',
    hidden.slug
  );
  await driver.sleep(300);

  await expectText(driver, 'main > section header h1', hidden.title);
  const stateHide = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.slug === target; });'
    + 'return s ? (s.hide ?? null) : null;',
    hidden.slug
  );
  assert.strictEqual(
    stateHide,
    true,
    `Hidden page should persist hide=true in state, got ${JSON.stringify(stateHide)}`
  );
}

/**
 * The Parent dropdown on the edit form omits the page being edited and its
 * direct children so the user cannot create a one-hop cycle.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function parentDropdownExcludesSelfAndDirectChildren(driver) {
  const parent = await createNewPage(driver, null, 'Parent Page', true);
  const parentId = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.slug === target; });'
    + 'return s ? s.id : null;',
    parent.slug
  );

  const child = await createNewPage(driver, null, 'Child Page');
  const childParentSelect = new Select(await driver.findElement(By.css('#parent')));
  await childParentSelect.selectByValue(parentId);
  await saveOpenedPage(driver);

  const sibling = await createNewPage(driver, null, 'Sibling Page', true);

  // Editing the parent — dropdown should exclude Parent (self) and Child
  // (direct child), leaving "None" and Sibling.
  await driver.findElement(By.css(`main .sb nav a[href="?page=${parent.slug}"]`)).click();
  await driver.sleep(150);
  const editButton = await expectText(driver, 'main > section header button', 'Edit');
  await editButton.click();
  await driver.sleep(150);

  const options = await driver.findElements(By.css('#parent option'));
  const optionTexts = await Promise.all(options.map(o => o.getText()));

  assert.ok(
    optionTexts.includes('None'),
    `Parent dropdown should always include "None", got ${JSON.stringify(optionTexts)}`
  );
  assert.ok(
    !optionTexts.some(t => t.startsWith(parent.title)),
    `Parent dropdown should not list the page being edited, got ${JSON.stringify(optionTexts)}`
  );
  assert.ok(
    !optionTexts.some(t => t.startsWith(child.title)),
    `Parent dropdown should not list direct children of the page being edited, got ${JSON.stringify(optionTexts)}`
  );
  assert.ok(
    optionTexts.some(t => t.startsWith(sibling.title)),
    `Parent dropdown should still list unrelated pages like "${sibling.title}", got ${JSON.stringify(optionTexts)}`
  );
}

/**
 * When the current page is deeply nested, every ancestor's <details> element
 * in the sidebar is auto-expanded so the current page is visible in-tree.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function deepNestedDetailsAutoExpandsForCurrentPage(driver) {
  const grandparent = await createNewPage(driver, null, 'Outer Page', true);
  const grandparentId = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.slug === target; });'
    + 'return s ? s.id : null;',
    grandparent.slug
  );

  const parent = await createNewPage(driver, null, 'Middle Page');
  const parentSelect = new Select(await driver.findElement(By.css('#parent')));
  await parentSelect.selectByValue(grandparentId);
  await saveOpenedPage(driver);
  const parentId = await driver.executeScript(
    'var target = arguments[0];'
    + 'var s = FW.state.p.pages.find(function (p) { return p.slug === target; });'
    + 'return s ? s.id : null;',
    parent.slug
  );

  const child = await createNewPage(driver, null, 'Inner Page');
  const childSelect = new Select(await driver.findElement(By.css('#parent')));
  await childSelect.selectByValue(parentId);
  await saveOpenedPage(driver);

  // Navigate to the All Pages view so that neither ancestor is the current
  // page. Scope the details selector to `nav ul` to skip the "New Page"
  // expander which is also a <details> but lives outside the tree.
  await driver.findElement(By.linkText('All Pages')).click();
  await driver.sleep(200);
  const closedAncestors = await driver.executeScript(
    'return Array.from(document.querySelectorAll("main .sb nav ul details")).map(function (d) {'
    + 'return { open: d.open, summary: d.querySelector("summary a")?.textContent };'
    + '});'
  );
  assert.strictEqual(
    closedAncestors.length,
    2,
    `Expected two tree <details> on All Pages view, got ${JSON.stringify(closedAncestors)}`
  );
  assert.ok(
    closedAncestors.every(d => d.open === false),
    `Ancestor <details> should be collapsed when viewing an unrelated page, got ${JSON.stringify(closedAncestors)}`
  );

  // Navigate to the deeply nested child via a synthetic link click so the
  // in-memory wiki state is preserved (a full driver.get() reload would wipe
  // all pages back to the fresh-served build).
  await driver.executeScript(
    'var a = document.createElement("a");'
    + 'a.href = "?page=" + arguments[0];'
    + 'document.body.appendChild(a);'
    + 'a.click();'
    + 'document.body.removeChild(a);',
    child.slug
  );
  await driver.sleep(300);

  const openStates = await driver.executeScript(
    'return Array.from(document.querySelectorAll("main .sb nav ul details")).map(function (d) {'
    + 'return { open: d.open, summary: d.querySelector("summary a")?.textContent };'
    + '});'
  );
  assert.strictEqual(
    openStates.length,
    2,
    `Expected two ancestor <details> (grandparent + parent), got ${JSON.stringify(openStates)}`
  );
  for (const entry of openStates) {
    assert.strictEqual(
      entry.open,
      true,
      `Ancestor <details> "${entry.summary}" should auto-open for a descendant page, got ${JSON.stringify(openStates)}`
    );
  }
}
