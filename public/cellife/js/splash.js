/**
 * @module splash
 * Handle actions in the splash section
 *
 * Note: No view needed
 */

import * as Log from "./utils/log4js.js";
import { properties as menuProperties } from "./menu.js";

export { SplashController };

Log.setLogLevel(Log.LEVEL_ERROR);

/**
 * The SplashController is used to display the splash animation and display the game section when a key is pressed or when the animation ends
 *
 * @param {Object} menuController
 * @param {HTMLElement} rootElt
 * @param {number} [splashDuration]
 * @returns {Object} { openSection(), closeSection() }
 */
const SplashController = (menuController, rootElt, splashDuration = 40*1000) => {
  let timeOutAnimationId;
  let preludeElt = rootElt.querySelector("#prelude");
  let introContentElt = rootElt.querySelector("#introContent");

  /**
   * Actions to be perform at the end of the animation or when the user press any key
   */
  const nextScreen = () => {
    // open the game section and show the menu
    menuController.open(menuProperties.SECTION_GAME);
    menuController.state.setValue(menuProperties.STATE_VISIBLE);
    document.querySelector("#username").focus();
  };

  const handleKeyBoard = (e) => {
    Log.debug(`SplashController.handleKeyBoard()`);
    clearTimeout(timeOutAnimationId);
    nextScreen();
  };

  /**
   * The openSection is automatically executed when the section is open
   */
  const openSection = () => {
    Log.debug(`SplashController.openSection()`);

    document.querySelector("header").classList.add("hidden");
    document.querySelector("footer").classList.add("hidden");
    // add handleKeyBoard
    window.addEventListener("click", handleKeyBoard);
    // start the animation
    document.body.classList.add("splash");
    preludeElt.style.animation = "prelude 7s linear 0s 1"; // point of interest : animation are start by setting the animation property
    introContentElt.style.animation = "introContent 60s linear 2s 1";

    // timeOut actions
    timeOutAnimationId = setTimeout(nextScreen, splashDuration);
  };

  /**
   * The closeSection is automatically executed when the section is close
   */
  const closeSection = () => {
    Log.debug(`SplashController.closeSection()`);

    document.querySelector("header").classList.remove("hidden");
    document.querySelector("footer").classList.remove("hidden");
    // remove handleKeyBoard
    window.removeEventListener("click", handleKeyBoard);
    // close the animation
    document.body.classList.remove("splash");
    preludeElt.style.animation = ""; // point of interest : animation are stopped by setting the animation property to null
    introContentElt.style.animation = "";
  };

  return {
    openSection,
    closeSection,
  };
};
