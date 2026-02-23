import assert from "assert";
import path from "path";
import { By, until, WebDriver } from "selenium-webdriver";
import { expectHtml, expectMissing, expectText } from "../../tests.mjs";
import { createNewPage, saveOpenedPage } from "../pages/index.mjs";

/**
 * Embedded images should list metadata and usage information within settings
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function listsEmbeddedImagesWithUsageInfo(driver) {
  const pageTitle = `Embedded Image Page ${Date.now()}`;
  const altText = 'Embedded Alt (List)';
  const { pageName, sizeLabel } = await createPageWithEmbeddedImage(driver, {
    pageTitle,
    altText,
    width: 10,
    height: 10,
  });

  await openSettings(driver);
  const galleryCard = await findEmbeddedImageCard(driver, altText, sizeLabel);

  const metaLabel = await galleryCard.findElement(By.css('span'));
  const metaText = await metaLabel.getText();
  assert.ok(
    metaText.includes(altText) && metaText.includes(sizeLabel),
    `Embedded image metadata should include alt text and size (${metaText})`
  );

  const usageSummary = await galleryCard.findElement(By.css('details > summary'));
  assert.strictEqual(
    await usageSummary.getText(),
    'Used in 1 pages',
    'Embedded image usage summary should show one referencing page'
  );

  await usageSummary.click();
  const usageList = await galleryCard.findElement(By.css('details ul'));
  const usageText = await usageList.getText();
  assert.ok(
    usageText.includes(pageName),
    'Embedded image usage list should include the referencing page title'
  );
}

/**
 * Viewing an embedded image from settings should open a preview window
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canPreviewEmbeddedImage(driver) {
  const pageTitle = `Embedded Image Preview ${Date.now()}`;
  const altText = 'Embedded Alt (Preview)';
  const { sizeLabel } = await createPageWithEmbeddedImage(driver, {
    pageTitle,
    altText,
    width: 11,
    height: 11,
  });

  await openSettings(driver);
  const galleryCard = await findEmbeddedImageCard(driver, altText, sizeLabel);

  const viewButton = await galleryCard.findElement(
    By.xpath(".//button[normalize-space(text())='View']")
  );

  const baseHandle = await driver.getWindowHandle();
  const handlesBefore = await driver.getAllWindowHandles();

  await viewButton.click();

  await driver.wait(async () => {
    const handles = await driver.getAllWindowHandles();
    return handles.length > handlesBefore.length;
  }, 2000);

  const handlesAfter = await driver.getAllWindowHandles();
  const previewHandle = handlesAfter.find((handle) => !handlesBefore.includes(handle));
  assert.ok(previewHandle, 'Clicking View should open a new preview window');

  await driver.switchTo().window(previewHandle);
  const previewImage = await driver.findElement(By.css('img'));
  const previewSrc = await previewImage.getAttribute('src');
  assert.ok(
    previewSrc.startsWith('data:image'),
    'Preview window should display the embedded image data URL'
  );

  await driver.close();
  await driver.switchTo().window(baseHandle);
}

/**
 * Deleting an embedded image should remove it from settings and replace page references
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function deletingEmbeddedImageRemovesReferences(driver) {
  const pageTitle = `Embedded Image Delete ${Date.now()}`;
  const altText = 'Embedded Alt (Delete)';
  const { pageName, pageSlug, sizeLabel } = await createPageWithEmbeddedImage(driver, {
    pageTitle,
    altText,
    width: 12,
    height: 12,
  });

  await openSettings(driver);
  const galleryCard = await findEmbeddedImageCard(driver, altText, sizeLabel);

  const deleteButton = await galleryCard.findElement(
    By.xpath(".//button[contains(@class,'del') and normalize-space(text())='Delete']")
  );
  await deleteButton.click();

  await driver.wait(until.alertIsPresent(), 1000);
  const confirmDeletion = await driver.switchTo().alert();
  confirmDeletion.accept();
  await driver.sleep(300);

  const remainingEntries = await driver.findElements(
    By.xpath(`//section[h1='Embedded Images']//span[contains(., '${altText} (${sizeLabel})')]`)
  );
  assert.strictEqual(
    remainingEntries.length,
    0,
    'Embedded image entry should be removed from settings after deletion'
  );

  const pageLink = await driver.findElement(By.css(`main .sb nav a[href="?page=${pageSlug}"]`));
  await pageLink.click();

  await expectText(driver, 'main > section header h1', pageName);
  const html = `<p><img src="deleted"></p>`;
  await expectHtml(driver, 'main > section > article.uc', html);
}

/**
 * Open wiki settings page through the sidebar link
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
async function openSettings(driver) {
  const settingsLink = await expectText(driver, 'main > .sb nav p a', 'Wiki Settings');
  await settingsLink.click();
  await expectText(driver, 'main > section > header > h1', 'Wiki Settings');
}

/**
 * Create a page with a freshly uploaded embedded image and save it
 * @param {WebDriver} driver
 * @param {{pageTitle: string, altText: string, width: number, height: number}} options
 * @return {Promise<{pageName: string, pageSlug: string, altText: string, sizeLabel: string}>}
 */
async function createPageWithEmbeddedImage(driver, { pageTitle, altText, width, height }) {
  const newPage = await createNewPage(driver, 'ed', pageTitle);

  await driver.executeScript(
    'FW.upload = (mime, cb) => {' +
    'const input = html`<input type="file" accept=${mime} onchange=${e => {' +
    'const f = e.target.files;' +
    'if (f.length > 0) cb(f[0]);' +
    'document.body.removeChild(input);' +
    '}} />`;' +
    'document.body.appendChild(input);' +
    '};'
  );

  await driver.sleep(200);
  const editor = await driver.findElement(By.css('#e .ed-uc'));
  await editor.click();
  await editor.clear();

  const insertButton = await expectText(
    driver,
    'main > section form div#e button[title="Insert Image from File"]',
    '📸'
  );
  await insertButton.click();

  await driver.wait(until.alertIsPresent(), 1000);
  const acknowledgeUpload = await driver.switchTo().alert();
  await acknowledgeUpload.accept();

  const imagePath = path.resolve('logo.svg');
  await driver.sleep(200);
  await driver.findElement(By.css('body input[type="file"]:last-of-type')).sendKeys(imagePath);

  await driver.wait(until.alertIsPresent(), 1000);
  const widthPrompt = await driver.switchTo().alert();
  await widthPrompt.sendKeys(String(width));
  await widthPrompt.accept();

  await driver.wait(until.alertIsPresent(), 1000);
  const heightPrompt = await driver.switchTo().alert();
  await heightPrompt.sendKeys(String(height));
  await heightPrompt.accept();

  await driver.wait(until.alertIsPresent(), 1000);
  const altPrompt = await driver.switchTo().alert();
  await altPrompt.sendKeys(altText);
  await altPrompt.accept();

  await driver.sleep(300);
  await saveOpenedPage(driver);
  await expectText(driver, 'main > section header h1', newPage.title);

  return {
    pageName: newPage.title,
    pageSlug: newPage.slug,
    altText,
    sizeLabel: `${width}x${height}px`,
  };
}

/**
 * Locate the embedded image gallery card by alt text and size label
 * @param {WebDriver} driver
 * @param {string} altText
 * @param {string} sizeLabel
 * @return {Promise<import('selenium-webdriver').WebElement>}
 */
async function findEmbeddedImageCard(driver, altText, sizeLabel) {
  const labelLocator = By.xpath(
    `//section[h1='Embedded Images']//span[contains(., '${altText} (${sizeLabel})')]`
  );
  const labelElement = await driver.findElement(labelLocator);
  return labelElement.findElement(By.xpath("./ancestor::div[contains(@class,'g')]"));
}
