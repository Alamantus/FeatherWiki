import assert from "assert";
import { Browser, Builder, By, until, WebDriver, WebElement } from "selenium-webdriver";
import * as settings from './tests/settings.mjs';
import * as ed from './tests/ed.mjs';
import * as tags from './tests/tags.mjs';

export async function runTests(args = []) {
    const driver = await new Builder().forBrowser(Browser.FIREFOX).build();
    const root = 'http://localhost:3000';
    await driver.get(root);
    await driver.sleep(500);

    const tests = {
      ...settings,
      ...ed,
      ...tags,
    }

    try {
      const testKeys = args.length > 0 ? args : Object.keys(tests);
      for (let i = 0; i < testKeys.length; i++) {
        const testName = testKeys[i];
        try {
          await tests[testName](driver);
          console.info('✅', testName)
        } catch (/** @var {Error} */ err) {
          console.error('❌', testName, err);
        }
        await driver.navigate().to(root);
        await driver.sleep(500);
      }
    } catch (/** @var {Error} */ err) {
      console.error(err);
    }

    await driver.quit();
}

/**
 * Assert that the element matching the provided cssSelector is visible
 * 
 * @param {WebDriver} driver The initialized browser driver
 * @param {String} cssSelector The selector that will find the element
 * @param {String|Error} failureMessage The message that will be output to the console if the element text does not match
 * 
 * @returns {WebElement}
 */
export async function expectVisible(driver, cssSelector, failureMessage) {
  const element = await driver.findElement(By.css(cssSelector));
  if (!element) {
    throw new Error('Element not found with CSS Selector `' + cssSelector + '`');
  }
  const isVisible = await element.isDisplayed();
  if (!failureMessage) {
    failureMessage = 'Element with CSS Selector `' + cssSelector + '` is not visible';
  }
  assert.equal(isVisible, true, failureMessage);
  return element;
}

/**
 * Assert that the element matching the provided cssSelector has the provided text
 * 
 * @param {WebDriver} driver The initialized browser driver
 * @param {String} cssSelector The selector that will find the element
 * @param {String} expectedText The content that is expected to be found
 * @param {String|Error} failureMessage The message that will be output to the console if the element text does not match
 * 
 * @returns {WebElement}
 */
export async function expectText(driver, cssSelector, expectedText, failureMessage) {
  const element = await driver.findElement(By.css(cssSelector));
  if (!element) {
    throw new Error('Element not found with CSS Selector `' + cssSelector + '`');
  }
  const elementText = await element.getText();
  if (!failureMessage) {
    failureMessage = 'Element with CSS Selector `' + cssSelector + '` had the text "' + elementText
      + '" instead of the expected "' + expectedText + '"';
  }
  assert.equal(elementText, expectedText, failureMessage);
  return element;
}

/**
 * Assert that the form element matching the provided cssSelector has the provided value
 * 
 * @param {WebDriver} driver The initialized browser driver
 * @param {String} cssSelector The selector that will find the element
 * @param {String} expectedText The content that is expected to be found
 * @param {String|Error} failureMessage The message that will be output to the console if the element text does not match
 * 
 * @returns {WebElement}
 */
export async function expectValue(driver, cssSelector, expectedValue, failureMessage) {
  const element = await driver.findElement(By.css(cssSelector));
  if (!element) {
    throw new Error('Element not found with CSS Selector `' + cssSelector + '`');
  }
  const elementText = await element.getAttribute('value');
  if (!failureMessage) {
    failureMessage = 'Field with CSS Selector `' + cssSelector + '` had the text "' + elementText
      + '" instead of the expected "' + expectedValue + '"';
  }
  assert.equal(elementText, expectedValue, failureMessage);
  return element;
}

/**
 * Create and fill a new page on the wiki without saving
 * 
 * @param {WebDriver} driver The initialized browser driver
 * @param {?String} editor The editor to use
 * @param {?String} pageTitle The title of the page to create
 * 
 * @returns {Object}
 */
export async function createNewPage(driver, editor = 'ed', pageTitle = null) {
  const newPageExpander = await expectText(driver, 'main > .sb nav > details summary', 'New Page');
  await newPageExpander.click();
  const newPageField = await expectVisible(driver, '#np', 'The New Page field should be visible');

  const newPageTitle = pageTitle ?? 'Page Title';
  const newPageSlug = await driver.executeScript('return FW.slug(arguments[0])', newPageTitle);
  await newPageField.sendKeys(newPageTitle);
  await driver.findElement(By.css('main .sb nav details form button')).click();

  // Should go to new page edit with title and slug filled
  await expectText(driver, 'main > section header h1', 'Edit Page');
  await expectValue(driver, 'main > section header #name', newPageTitle);
  await expectValue(driver, 'main > section header #slug', newPageSlug);
  let textarea;
  if (editor === 'md') {
    await driver.findElement(By.css('main > section form > div.w1.tr button')).click();
    await expectVisible(driver, 'main > section form > textarea', 'The markdown textarea should be visible');
    textarea = await driver.findElement(By.css('main > section form > textarea'));
    await driver.wait(until.elementIsVisible(textarea));
    await textarea.click();
  } else {
    await expectVisible(driver, '#e', 'The visual editor should be visible');
    textarea = await driver.findElement(By.css('#e .ed-uc'));
    await driver.wait(until.elementIsVisible(textarea));
    await textarea.click();
  }
  const newPageContent = 'This is a new page';
  await textarea.sendKeys(newPageContent);

  return {
    title: newPageTitle,
    slug: newPageSlug,
    content: newPageContent,
  };
}
