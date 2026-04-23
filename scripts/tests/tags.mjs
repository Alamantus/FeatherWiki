import assert from "assert";
import { expectMissing, expectText } from "../tests.mjs";
import { By, WebDriver } from "selenium-webdriver";
import { createNewPage, saveOpenedPage } from "./pages/index.mjs";

/**
 * When setting tags on a new page, those tags appear on the page and in the sidebar
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canCreateNewPageWithTags(driver) {
  await createNewPage(driver);
  const tagsField = await driver.findElement(By.css('#tags'));
  const tag = 'tag 1';
  tagsField.sendKeys(tag);
  await saveOpenedPage(driver);

  await expectText(driver, 'main > section dl dd', tag, 'Could not find tag on created page');
  await expectText(driver, 'main .sb nav .tabs button:nth-child(2)', 'Tags');
  await driver.findElement(By.css('main .sb nav .tabs button:nth-child(2)')).click();
  await expectText(driver, 'main .sb nav ul li:first-child', tag);
}

/**
 * Pages with tags are filtered correctly when clicking from the sidebar.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canFilterPagesByTag(driver) {
  await createNewPage(driver, 'ed', 'Untagged Page', true);

  await canCreateNewPageWithTags(driver);

  await driver.findElement(By.css('main .sb nav ul li:first-child a')).click();
  await expectText(driver, 'main > section header h1', 'Pages Tagged tag 1');
  const list = await expectText(driver, 'main > section article ul', 'Page Title');
  assert.doesNotMatch(await list.getText(), /.*Untagged Page.*/);
}

/**
 * Switch to the Tags tab in the sidebar nav
 * @param {WebDriver} driver
 * @returns {Promise<void>}
 */
async function openTagsTab(driver) {
  const tagsTabButton = await driver.findElement(
    By.xpath("//main/div[contains(@class,'sb')]//nav//div[contains(@class,'tabs')]/button[normalize-space(text())='Tags']")
  );
  await tagsTabButton.click();
  await driver.sleep(100);
}

/**
 * A page with multiple comma-separated tags renders them all in the page's tag
 * list and in the sidebar's Tags tab.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function multipleTagsRenderOnPage(driver) {
  await createNewPage(driver);
  const tagsField = await driver.findElement(By.css('#tags'));
  await tagsField.sendKeys('alpha,beta,gamma');
  await saveOpenedPage(driver);

  const dds = await driver.findElements(By.css('main > section dl dd a'));
  const tagTexts = await Promise.all(dds.map(dd => dd.getText()));
  assert.deepStrictEqual(
    tagTexts.sort(),
    ['alpha', 'beta', 'gamma'],
    `All three tags should render on the page, got ${JSON.stringify(tagTexts)}`
  );

  await openTagsTab(driver);
  const sidebarLinks = await driver.findElements(By.css('main .sb nav ul li a'));
  const sidebarTags = await Promise.all(sidebarLinks.map(a => a.getText()));
  for (const expected of ['alpha', 'beta', 'gamma']) {
    assert.ok(
      sidebarTags.includes(expected),
      `Sidebar tag list should include "${expected}", got ${JSON.stringify(sidebarTags)}`
    );
  }
}

/**
 * Removing the only tag on the only page removes that tag from the sidebar
 * Tags list (the tab itself also disappears once no tags remain).
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canRemoveTagFromPage(driver) {
  await canCreateNewPageWithTags(driver);

  const pageLink = await driver.findElement(
    By.xpath("//main/div[contains(@class,'sb')]//nav//div[contains(@class,'tabs')]/button[normalize-space(text())='Pages']")
  );
  await pageLink.click();
  await driver.sleep(100);
  await driver.findElement(By.css('main .sb nav ul li:first-child a')).click();
  await driver.sleep(150);

  const editButton = await expectText(driver, 'main > section header button', 'Edit');
  await editButton.click();
  await driver.sleep(150);

  // Clear the tags field directly — in nanohtml's re-rendered DOM a stale
  // WebElement handle can point to a detached input after earlier renders.
  await driver.executeScript(
    'var el = document.getElementById("tags");'
    + 'el.value = "";'
    + 'el.dispatchEvent(new Event("change", { bubbles: true }));'
  );
  await driver.sleep(150);
  await saveOpenedPage(driver);

  const tagDds = await driver.findElements(By.css('main > section dl dd'));
  assert.strictEqual(
    tagDds.length,
    0,
    `Page should have no tags after clearing; found ${tagDds.length}`
  );

  const stateTags = await driver.executeScript('return FW.state.t;');
  assert.deepStrictEqual(
    stateTags,
    [],
    `state.t should be empty after removing the only tag, got ${JSON.stringify(stateTags)}`
  );

  const tabsButtons = await driver.findElements(By.css('main .sb nav .tabs button'));
  const tabsLabels = await Promise.all(tabsButtons.map(b => b.getText()));
  assert.ok(
    !tabsLabels.includes('Tags'),
    `Tags tab should be removed from sidebar when no tags remain; got tabs ${JSON.stringify(tabsLabels)}`
  );
}

/**
 * The Add Existing Tag dropdown lists every tag already in use on other pages
 * and excludes tags already attached to the page being edited.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function addExistingTagDropdownListsAndExcludesSelected(driver) {
  await createNewPage(driver, null, 'Seed Page');
  const seedTags = await driver.findElement(By.css('#tags'));
  await seedTags.sendKeys('shared,other');
  await saveOpenedPage(driver);

  await createNewPage(driver, null, 'Target Page');

  // Set the #tags field and fire the change event so `store` updates
  // state.edits.tags, triggering a re-render that re-filters the dropdown.
  await driver.executeScript(
    'var el = document.getElementById("tags");'
    + 'el.value = "shared";'
    + 'el.dispatchEvent(new Event("change", { bubbles: true }));'
  );
  await driver.sleep(150);

  // First select in the footer is the "Add Existing Tag" dropdown (the second
  // is the "Parent" dropdown). Scope to that specific select to avoid mixing
  // their options.
  const allOptions = await driver.findElements(
    By.xpath("//main/section//form/footer/div[1]/select/option")
  );
  const optionTexts = await Promise.all(allOptions.map(opt => opt.getText()));
  assert.ok(
    optionTexts.includes('other'),
    `"Add Existing Tag" dropdown should list the unused tag "other", got ${JSON.stringify(optionTexts)}`
  );
  assert.ok(
    !optionTexts.includes('shared'),
    `"Add Existing Tag" dropdown should exclude already-selected "shared", got ${JSON.stringify(optionTexts)}`
  );
}

/**
 * Navigating to ?tag=<name-that-no-page-uses> renders the tagged view with the
 * "None Found" empty-state message.
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function taggedViewRendersNoneFoundForUnknownTag(driver) {
  await driver.get('http://localhost:3000/?tag=nonexistent');
  await driver.sleep(300);

  await expectText(driver, 'main > section header h1', 'Pages Tagged nonexistent');
  await expectText(
    driver,
    'main > section article',
    'None Found',
    'Tagged view should show the "None Found" empty state for unknown tags'
  );
  await expectMissing(
    driver,
    'main > section article ul',
    'No page list should render when there are no pages matching the tag'
  );
}
