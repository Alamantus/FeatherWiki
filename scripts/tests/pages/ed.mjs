import assert from "assert";
import { expectHtml, expectText, expectVisible } from "../../tests.mjs";
import { By, until, WebDriver } from "selenium-webdriver";
import { createNewPage, saveOpenedPage } from "./index.mjs";
import path from "path";

/**
 * Pages can be created using the New Page button and display correctly when saved
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canCreateNewPageWithEd(driver) {
  const newPage = await createNewPage(driver, 'ed', null, true);

  await expectText(driver, 'main > section header h1', newPage.title);
  await expectText(driver, 'main > section > article.uc', newPage.content);
  const url = await driver.getCurrentUrl();
  assert.match(url, new RegExp('page=' + newPage.slug), `URL ${url} does not contain the slug ${newPage.slug}`);
  await expectText(driver, 'main .sb nav ul li:first-child', newPage.title);
}

/**
 * Created pages can be edited with new content and title successfully
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canEditNewPageWithEd(driver) {
  await canCreateNewPageWithEd(driver);

  const editButton = await expectText(driver, 'main > section header button', 'Edit');
  await editButton.click();
  await expectVisible(driver, '#e', 'The visual editor should be visible');
  const textarea = await driver.findElement(By.css('#e .ed-uc'));
  await driver.wait(until.elementIsVisible(textarea));
  await textarea.click();
  await textarea.clear();
  const newPageContent = 'The page has been edited';
  await textarea.sendKeys(newPageContent);
  await saveOpenedPage(driver);

  await expectText(driver, 'main > section > article.uc', newPageContent);
}

/**
 * Pages can edit the raw HTML of its content
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canModifyRawHtmlWithEd(driver) {
  await createNewPage(driver, 'ed');

  const htmlButton = await expectText(driver, 'main > section form div.tr button[type="button"]', 'Show HTML');
  htmlButton.click();
  await driver.sleep(500);
  const textarea = await driver.findElement(By.css('main > section form > textarea'));
  await driver.wait(until.elementIsVisible(textarea));
  await textarea.click();
  await textarea.clear();
  const html = '<p>This is custom HTML</p>';
  textarea.sendKeys(html);

  await saveOpenedPage(driver);

  await expectHtml(driver, 'main > section > article.uc', html);
}

/**
 * Pages can edit the raw HTML of its content
 * @param {WebDriver} driver The initialized browser driver
 * @return {Promise<void>}
 */
export async function canUploadImageWithEd(driver) {
  await createNewPage(driver, 'ed');

  // Overwrite FW.upload() to not rely on file selector modal
  await driver.executeScript('FW.upload = (mime, cb) => {'
    + 'const input = html`<input type="file" accept=${mime} onchange=${e => {'
      + 'const f = e.target.files;'
      + 'if (f.length > 0) cb(f[0]);'
      + 'document.body.removeChild(input);'
    + '}} />`;'
    + 'document.body.appendChild(input);'
  + '};');

  await driver.sleep(500);
  const textarea = await driver.findElement(By.css('#e .ed-uc'));
  await driver.wait(until.elementIsVisible(textarea));
  await textarea.click();
  await textarea.clear();

  const insertButton = await expectText(driver, 'main > section form div#e button[title="Insert Image from File"]', '📸');
  insertButton.click();

  await driver.wait(until.alertIsPresent());
  const confirmUpload = await driver.switchTo().alert();
  const confirmUploadText = await confirmUpload.getText();
  assert.equal(confirmUploadText, "Inserting images increases your wiki's file size. Continue?");
  await confirmUpload.accept();

  // Image path is relative to current directory, i.e. project root
  const image = path.resolve('logo.svg');
  await driver.sleep(500);
  await driver.findElement(By.css('body input[type="file"]:last-of-type'))
    .sendKeys(image);

  await driver.wait(until.alertIsPresent());
  const widthPrompt = await driver.switchTo().alert();
  const widthPromptText = await widthPrompt.getText();
  assert.equal(widthPromptText, 'Max width pixels:');
  await widthPrompt.sendKeys('10');
  await widthPrompt.accept();

  await driver.wait(until.alertIsPresent());
  const heightPrompt = await driver.switchTo().alert();
  const heightPromptText = await heightPrompt.getText();
  assert.equal(heightPromptText, 'Max height pixels:');
  await heightPrompt.sendKeys('10');
  await heightPrompt.accept();

  await driver.wait(until.alertIsPresent());
  const altPrompt = await driver.switchTo().alert();
  const altPromptText = await altPrompt.getText();
  assert.equal(altPromptText, 'Alt text:');
  await altPrompt.accept();

  // Keeping this commented in case image changes and test needs to be updated
  // const html = await driver.executeScript('return document.querySelector("#e .ed-uc")?.innerHTML ?? null');
  // console.log(html);

  const html = '<p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAABfklEQVQYV2PUiJqz/Nuv3+cfrcnsYoAAdiD+CWUzyIVOr+BkZ9FhVAideZ2DjUnt869fxk9XZ18wiWj2e/zm65WXezruSYfOMuBnZzr/9efvm4zyIdOPCvKyW7z7/OvMozUZ5nqhrUtff/j24Pnu1mqg3DkBHjbD919/HWWUC50RIsjNtvLT998Mf3790+dleLv6/Zcfj5h4ZMrY2ZjOc7EzMwLlQhllQvs4mf9zPRDlZxd59elnI/efNxUfvnx/w8Ivu1CMn73mzacfrx9++S3LCHI00IpaEX6Ohtcffx7j/P3K5suP379Y+KTPivCxW776+Kv68Zr0NrBChdCpElxs7A9//f33i+HbS84fv/8ycAlK/WJhYmJ5+/W3zMv1ma/ACkFALnhmHj83S+vXD8/Z//7595dPVPrfx6+/K4AenAyShyuU8p3JJcDPfOHHx9eMQJMl+YTFXnz48E/v2eb0bygKQRxxt0XcrP8uZbGxsf36zC099/Xq7C8wGwFYd6q/Ia1YEwAAAABJRU5ErkJggg==#-553774246"></p>';
  await expectHtml(driver, '#e .ed-uc', html);
}
