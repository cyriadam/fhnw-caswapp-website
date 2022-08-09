/**
 * @module help
 * Handle actions in the help section
 *
 * Note: No view needed
 */

import * as Log from "./utils/log4js.js";
import { properties as menuProperties } from "./menu.js";

export { HelpController };

Log.setLogLevel(Log.LEVEL_ERROR);

/**
 * The HelpController is used to handle keyboard and display the hidden admin menu button when specific keys are pressed
 * @param {Object} menuController
 * @returns {Object} { openSection(), closeSection() }
 */
const HelpController = (menuController) => {
  const handleKeyBoard = ({ ctrlKey, key }) => {
    Log.debug(`e.ctrlKey=[${ctrlKey}], e.key=[${key}],`);
    if (ctrlKey && key == "A") {
      Log.debug(`HelpController.handleKeyBoard()`);
      let state = menuController.section(menuProperties.SECTION_ADMIN).state.getValue();
      menuController
        .section(menuProperties.SECTION_ADMIN)
        .state.setValue(state == menuProperties.STATE_VISIBLE ? menuProperties.STATE_HIDDEN : menuProperties.STATE_VISIBLE);
    }
  };

  /**
   * The openSection is automatically executed when the section is open
   */
  const openSection = () => {
    Log.debug(`HelpController.openSection()`);

    // add handleKeyBoard
    window.addEventListener("keydown", handleKeyBoard);
  };

  /**
   * The closeSection is automatically executed when the section is close
   */
  const closeSection = () => {
    Log.debug(`HelpController.closeSection()`);

    // remove handleKeyBoard
    window.removeEventListener("keydown", handleKeyBoard);
  };

  return {
    openSection,
    closeSection,
  };
};
