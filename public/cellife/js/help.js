import * as Log from "./utils/log4js.js";
import { properties as menuProperties } from "./menu.js";

export { HelpController };

Log.setLogLevel(Log.LEVEL_ERROR);

const HelpController = (menuController, rootElt) => {
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

  const openSection = () => {
    Log.debug(`HelpController.openSection()`);

    // add handleKeyBoard
    window.addEventListener("keydown", handleKeyBoard);
  };

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
