/**
 * @module utils/test
 * The test "framework"
 */

import { Tuple } from "./lambda.js";
import * as Log from "./log4js.js";

export { tat, allTat };

Log.setLogLevel(Log.LEVEL_ERROR);

/**
 * Tests are organised in test suites
 * @returns 
 */
const AllTat = () => {
  const allTatResults = [];
  const [TatResult, getTatId, getTatResult] = Tuple(2);
  const [UseCaseResult, getUseCaseId, getUseCaseSucceed, getUseCaseDesc] = Tuple(3);

  const add = (tatId, tatResult) => {
    const tat = TatResult(tatId, tatResult);
    allTatResults.push(tat);
  };

  /**
   * Render the results of the test suite 
   * 
   * Note : the templates for the rendering in embedded in the html itself
   * @param {Element} containerElement 
   */
  const render = (containerElement) => {
    Log.debug("render test results");
    let $templateSucceed = document.querySelector("#template-succeed").innerHTML;
    let $templateFails = document.querySelector("#template-failed").innerHTML;
    let $templateUseCase = document.querySelector("#template-usecase").innerHTML;
    let templateSucceed = (id, nb) => eval("`" + $templateSucceed + "`");           // point of interest : the var used in the template are added to the context of the function
    let templateFails = (id, nbFails, nb, failsInnerHtml) => eval("`" + $templateFails + "`");
    let templateUseCase = (id, desc) => eval("`" + $templateUseCase + "`");

    allTatResults.forEach((tat) => {
      Log.debug(`- tat [${getTatId(tat)}] contains [${getTatResult(tat).length}] cases`);
      const tatResultComponent = getTatResult(tat).every((r) => getUseCaseSucceed(r))
        ? templateSucceed(getTatId(tat), getTatResult(tat).length)
        : templateFails(
            getTatId(tat),
            getTatResult(tat).filter((r) => !getUseCaseSucceed(r)).length,
            getTatResult(tat).length,
            getTatResult(tat).reduce((prev, curr, idx) => prev + (getUseCaseSucceed(curr) ? "" : templateUseCase(getUseCaseId(curr), getUseCaseDesc(curr))), "")
          );
      containerElement.innerHTML += tatResultComponent;
    });
  };

  return {
    render: render,
    add: add,
  };
};

/**
 * Keep the result of all testcases
 */
const allTat = AllTat();

/**
 * Assert a single testcase
 * @param {boolean} verbose 
 * @returns 
 */
const Assert = (verbose = false) => {
  const useCaseResults = [];                    // list of all testcase result
  const [UseCaseResult, getUseCaseId, getUseCaseSucceed, getUseCaseDesc] = Tuple(3);

  /**
   * Assert that two expressions are equal
   * @param {boolean} actual 
   * @param {boolean} expected 
   * @param {String} [message] 
   */
  const equals = (actual, expected, message) => {
    const succeed = actual === expected;
    const desc = succeed ? undefined : message == undefined ? `not equal! actual was '${actual}' but expected '${expected}'` : message;
    if (verbose && desc) Log.error(desc);
    useCaseResults.push(UseCaseResult(useCaseResults.length + 1, succeed, desc));
  };

  return {
    equals: equals,
    getOk: () => useCaseResults.map(getUseCaseSucceed),
    getUseCaseResults: () => useCaseResults,
  };
};

/**
 * A newly created Assert object is passed into the callback function where it is used to
 * assert test results against expectations and keep track of the results for later reporting.
 * @param {String} id 
 * @param {Function} testCase - callback 
 * @param {boolean} verbose - output the error to the console
 * @returns {Array} - the resulty of the testcases
 */
const tat = (id, testCase, verbose = false) => {
  const assert = Assert(verbose);
  testCase(assert);
  allTat.add(id, assert.getUseCaseResults());       
  return assert.getOk();
};
