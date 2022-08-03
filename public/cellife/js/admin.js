import { checkFieldLength, clearError } from "./utils/general.js";
import * as Log from "./utils/log4js.js";
import { renderSlider } from "./utils/slider.js";

export { AdminView };

Log.setLogLevel(Log.LEVEL_ERROR);

const AdminView = (dataPoolController, hallOfFameController, rootElt) => {
  let resetHofBtn = rootElt.querySelector("#resetHof");
  let welcomeTextInputElt = rootElt.querySelector("#welcomeTextInput");
  let nbPlayerBulletsElt = rootElt.querySelector("#nbPlayerBullets");
  let nbBombsElt = rootElt.querySelector("#nbBombs");
  let gameDurationElt = rootElt.querySelector("#gameDuration");
  let gameTimeOutElt = rootElt.querySelector("#gameTimeOut");
  let welcomeTxtElt = rootElt.querySelector("#welcomeTxt");

  //!\ NEVER oninput to avoid loop event with dataPoolController !!! /!\
  dataPoolController.getObsIn("nbPlayerBullets").onChange((val) => {
    nbPlayerBulletsElt.value = val;
    renderSlider(nbPlayerBulletsElt)();
  });
  nbPlayerBulletsElt.onchange = (e) => dataPoolController.getObsOut("nbPlayerBullets").setValue(e.target.value);
  dataPoolController.getObsIn("nbBombs").onChange((val) => {
    nbBombsElt.value = val;
    renderSlider(nbBombsElt)();
  });
  nbBombsElt.onchange = (e) => dataPoolController.getObsOut("nbBombs").setValue(e.target.value);
  dataPoolController.getObsIn("gameDuration").onChange((val) => {
    gameDurationElt.value = val;
    renderSlider(gameDurationElt)();
  });
  gameDurationElt.onchange = (e) => dataPoolController.getObsOut("gameDuration").setValue(e.target.value);
  dataPoolController.getObsIn("gameTimeOut").onChange((val) => {
    gameTimeOutElt.value = val;
    renderSlider(gameTimeOutElt)();
  });
  gameTimeOutElt.onchange = (e) => dataPoolController.getObsOut("gameTimeOut").setValue(e.target.value);

  dataPoolController.getObsIn("welcomeText").onChange((val) => (welcomeTextInputElt.value = val));
  welcomeTextInputElt.onfocus = (e) => clearError(welcomeTextInputElt);
  welcomeTextInputElt.onchange = (e) => {
    if ([checkFieldLength(welcomeTextInputElt, 5)].some((r) => !r)) return;
    dataPoolController.getObsOut("welcomeText").setValue(e.target.value);
  };
  dataPoolController.getObsIn("welcomeText").onChange((val) => (welcomeTxtElt.innerHTML = val));

  resetHofBtn.onclick = (e) => hallOfFameController.hofReset();
};
