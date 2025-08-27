import assert from "assert";
import { Browser, Builder, By, until, WebDriver, WebElement } from "selenium-webdriver";
import * as settings from './tests/settings.mjs';
import * as ed from './tests/pages/ed.mjs';
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
    failureMessage = 'Field with CSS Selector `' + cssSelector + '` had the value "' + elementText
      + '" instead of the expected "' + expectedValue + '"';
  }
  assert.equal(elementText, expectedValue, failureMessage);
  return element;
}
