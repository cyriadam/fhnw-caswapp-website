/**
 * @module starter
 * Initialise all controllers and views used in the cellife game
 */

import { io } from "./client-dist/socket.io.esm.min.js";
import { MenuController, MenuView, MenuModel } from "./menu.js";
import { SplashController } from "./splash.js";
import { HelpController } from "./help.js";
import { DataPoolController } from "./dataPool.js";
import { HallOfFameController, HallOfFameView, HallOfFameItemModel } from "./hallOfFame.js";
import { AdminView } from "./admin.js";
import { secureHtmlInputs, escapeDialogs } from "./utils/general.js";
import { renderSliders } from "./utils/slider.js";
import { GameController, GameView } from "./game.js";
import { PartyController, PartyView, PartyItemModel, NoPartyItem } from "./party.js";
import { ChatController, ChatView, ChatItemModel } from "./chat.js";
import { SelectionController } from "./controller.js";
import { persistCheckboxes, reset } from "./utils/localStorage.js";

const mainStarter = () => {
  const socket = io();

  // settings of the game
  const properties = {
    splashDuration: 40 * 1000, // duration of the splash screen
    nbMaxChatItems: 20, // number max of line is the chat
  };

  const rootElt = document.querySelector("#main-content");
  const menuElt = document.querySelector("#section-menu");

  // initialise controllers and views
  const menuController = MenuController(MenuModel);
  const splashController = SplashController(menuController, rootElt, properties.splashDuration);
  const helpController = HelpController(menuController);
  const hallOfFameController = HallOfFameController(socket, HallOfFameItemModel);
  const dataPoolController = DataPoolController(socket);
  const partyController = PartyController(socket, PartyItemModel);
  const chatController = ChatController(ChatItemModel, properties.nbMaxChatItems);
  const partySelectionController = SelectionController(NoPartyItem);
  const gameController = GameController(socket, hallOfFameController, partyController, menuController);

  const menuView = MenuView(menuController, splashController, helpController, gameController, rootElt, menuElt);
  const hallOfFameView = HallOfFameView(hallOfFameController, rootElt);
  const adminView = AdminView(dataPoolController, hallOfFameController, rootElt);
  const gameView = GameView(gameController, hallOfFameController, rootElt);
  const chatView = ChatView(chatController, dataPoolController, gameController, rootElt);
  const partyView = PartyView(partyController, gameController, partySelectionController, rootElt);

  menuController.init();            // build the menu and open the splash
  gameController.init();            // initialise the game
  secureHtmlInputs();               // prevent all input fields from html injection
  renderSliders(rootElt);           // render the sliders
  persistCheckboxes("persist");     // persist checkboxes state
  escapeDialogs();                  // customize the dialogs
};

mainStarter();
