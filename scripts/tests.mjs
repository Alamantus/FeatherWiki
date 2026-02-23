import assert from "assert";
import { Browser, Builder, By, until, WebDriver, WebElement } from "selenium-webdriver";
import * as settings from './tests/settings.mjs';
import * as ed from './tests/pages/ed.mjs';
import * as md from './tests/pages/md.mjs';
import * as nesting from './tests/pages/nesting.mjs';
import * as tags from './tests/tags.mjs';
import * as missing from './tests/missing.mjs';
import * as mediaEmbedded from './tests/media/embedded.mjs';

export async function runTests(args = []) {
    const driver = await new Builder().forBrowser(Browser.FIREFOX).build();
    const root = 'http://localhost:3000';
    await driver.get(root);
    await driver.sleep(500);

    const tests = {
      ...settings,
      ...ed,
      ...md,
      ...nesting,
      ...tags,
      ...missing,
      ...mediaEmbedded,
    }

    let passes = 0;
    const failures = [];
    const testsBegin = Date.now();

    try {
      const testKeys = args.length > 0 ? args : Object.keys(tests);
      for (let i = 0; i < testKeys.length; i++) {
        const testStart = Date.now();
        const testName = testKeys[i];
        try {
          await tests[testName](driver);
          const testEnd = Date.now();
          console.info('✅', testName, `(${testEnd - testStart}ms)`);
          passes++;
        } catch (/** @var {Error} */ error) {
          const testEnd = Date.now();
          console.error('❌', testName, `(${testEnd - testStart}ms)`);
          failures.push({ testName, error });
        }
        await driver.navigate().to(root);
        await driver.sleep(300);
      }
    } catch (/** @var {Error} */ err) {
      console.error(err);
    }

    const testsComplete = Date.now();
    let time = (testsComplete - testsBegin) / 1000;
    if (time > 60) {
      time = `${Math.floor(time / 60)} minutes`;
      if (time % 60 > 0) {
        time += ` ${time % 60}`;
      }
    }

    failures.forEach((failure) => {
      console.log('\n------------------------------\n');
      console.error('❌', failure.testName, '\n', failure.error);
    });
    console.log('\n------------------------------\n');
    console.info(`Ran ${time} seconds: ${passes} passed, ${failures.length} failed\n`);

    await driver.quit();
}

/**
 * Assert that the element matching the provided cssSelector is visible
 *
 * @param {WebDriver} driver The initialized browser driver
 * @param {String} cssSelector The selector that will find the element
 * @param {String|Error} failureMessage The message that will be output to the console if the element text does not match
 *
 * @returns {Promise<WebElement>}
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
 * @returns {Promise<WebElement>}
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
 * Assert that the element matching the provided cssSelector has the provided inner HTML
 *
 * @param {WebDriver} driver The initialized browser driver
 * @param {String} cssSelector The selector that will find the element
 * @param {String} expectedHtml The content that is expected to be found
 * @param {String|Error} failureMessage The message that will be output to the console if the element text does not match
 *
 * @returns {Promise<WebElement>}
 */
export async function expectHtml(driver, cssSelector, expectedHtml, failureMessage) {
  const element = await driver.findElement(By.css(cssSelector));
  if (!element) {
    throw new Error('Element not found with CSS Selector `' + cssSelector + '`');
  }

  let html = await driver.executeScript('return document.querySelector(arguments[0])?.innerHTML ?? null', cssSelector);
  if (!html) {
    throw new Error('innerHTML not found with CSS Selector `' + cssSelector + '`');
  }
  html = html.trim();
  if (!failureMessage) {
    failureMessage = 'Element with CSS Selector `' + cssSelector + '` had the html "' + html
      + '" instead of the expected "' + expectedHtml + '"';
  }
  assert.equal(html, expectedHtml, failureMessage);
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
 * @returns {Promise<WebElement>}
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

/**
 * Assert that the element matching the provided cssSelector is not present on the page
 *
 * @param {WebDriver} driver The initialized browser driver
 * @param {String} cssSelector The selector that will find the element
 * @param {String|Error} failureMessage The message that will be output to the console if the element text does not match
 *
 * @returns {Promise<void>}
 */
export async function expectMissing(driver, cssSelector, failureMessage) {
  const matchingElements = await driver.findElements(By.css(cssSelector));

  assert.equal(matchingElements.length < 1, true, failureMessage);
}
