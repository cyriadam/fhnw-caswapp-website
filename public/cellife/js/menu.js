/**
 * @module menu
 * Build the menu corresponding to differents sections of the page and close or open them according to menu interaction or dynamically 
 * 
 * Note: When a section is open or close, a dedicated script could be configured to initialise of reset it.
 */

import { menuProjector, setMenuState, pageCss as menuProjectorPageCss } from "./projectors/menuProjector.js";
import { addStyle, sequence } from "./utils/general.js";
import { ObservableList, Observable } from "./utils/observable.js";
import { Attribute, properties as propertiesAttr } from "./utils/presentationModel.js";
import { Tuple } from "./utils/lambda.js";
import * as Log from "./utils/log4js.js";

export { MenuController, MenuView, MenuModel, properties, MenuItem };

Log.setLogLevel(Log.LEVEL_ERROR);

/**
 * Properties related to the menu
 */
const properties = {
  STATE_VISIBLE: "visible",             // MenuItem is displaid
  STATE_HIDDEN: "hidden",               // MenuItem is not visible, but space is allocated for it on the page
  STATE_NONE: "none",                   // The MenuItem will not appear on the page at all
  SECTION_SPLASH: "section-splash",     // Element id corresponding to the splash section
  SECTION_GAME: "section-game",         // Element id corresponding to the game section
  SECTION_HOF: "section-hof",           // Element id corresponding to the Hall of Fame section
  SECTION_HELP: "section-help",         // Element id corresponding to the Help section
  SECTION_SETTINGS: "section-settings", // Element id corresponding to the User settings section
  SECTION_ADMIN: "section-admin",       // Element id corresponding to the Admin section
};

/**
 * Initialisation of the different sections/screens
 *
 * Properties are :
 * - the name of the section ( which will be display in the menu button )
 * - the element id of the section
 * - the script which will be executed when the section is open
 * - the script which will be executed when the section is closed
 * - the initial state
 */
const [MenuItem, getMenuName, getMenuSection, getMenuScriptOpen, getMenuScriptClose, getMenuState] = Tuple(5);
const splash = MenuItem("Splash", properties.SECTION_SPLASH, "splashController.openSection", "splashController.closeSection", properties.STATE_NONE);
const game = MenuItem("Game", properties.SECTION_GAME, "gameController.openSection", "stopSound", properties.STATE_VISIBLE);
const hof = MenuItem("Hall Of Fame", properties.SECTION_HOF, 'playSound("STARSWAR.WAV", 1, "toggleMusic")', "stopSound", properties.STATE_VISIBLE);
const help = MenuItem("Help", properties.SECTION_HELP, "helpController.openSection", "helpController.closeSection", properties.STATE_VISIBLE);
const settings = MenuItem("Settings", properties.SECTION_SETTINGS, undefined, undefined, properties.STATE_VISIBLE);
const admin = MenuItem("Admin", properties.SECTION_ADMIN, undefined, undefined, properties.STATE_HIDDEN);

const ALL_SECTIONS = [splash, game, hof, help, settings, admin];

const menuItemIdSequence = sequence();

/**
 * Create the Menu item object
 * @param {Object} template
 * @returns {Object} { id, text(), section(), selected(), state(), scriptOpen, scriptClose, toString()}
 */
const MenuModel = (template) => {
  const id = menuItemIdSequence.next().value; 

  const selected = Observable(false); 
  const state = Observable(template ? getMenuState(template) : properties.STATE_VISIBLE); 
  const textAttr = Attribute(template ? getMenuName(template) : "noname", `MenuItem.${id}.text`); 
  textAttr.getObs(propertiesAttr.NAME).setValue("text");
  const sectionAttr = Attribute(template ? getMenuSection(template) : undefined, `MenuItem.${id}.section`); 
  sectionAttr.getObs(propertiesAttr.NAME).setValue("section");
  const scriptOpen = template ? getMenuScriptOpen(template) : undefined; 
  const scriptClose = template ? getMenuScriptClose(template) : undefined; 

  return {
    id,                         // unique id of the menu item
    text: textAttr,             // the name of the menu item, used in the projector
    section: sectionAttr,       // the id of the html container
    selected,                   // true if the menu item is selected
    state,                      // current state of the menu item
    scriptOpen,                 // the script executed when the matching section is open
    scriptClose,                // the script executed when the matching section is close
    toString: () =>
      "" +
      `${textAttr.getObs(propertiesAttr.NAME).getValue()} = [${textAttr.getValue()}], ` +
      `${sectionAttr.getObs(propertiesAttr.NAME).getValue()} = [${sectionAttr.getValue()}]`,
  };
};


/**
 * The MenuController is used to handle interactions with the view
 * @param {Object} menuItemConstructor 
 * @returns {Object} { init(), addMenuItem(), onAddMenuItem(), open(), close(), state(), section() }
 */
const MenuController = (menuItemConstructor) => {
  const state = Observable(properties.STATE_VISIBLE);       // the global state of the menu (visible, hidden)
  const listMenuItems = ObservableList([]);                 // list of all menu items

  /**
   * Create a new menu item and add it to the list 
   * @param {Object} template 
   * @returns {Object}
   */
  const addMenuItem = (template) => {
    Log.debug(`MenuController.addMenuItem(${getMenuName(template)})`);
    const item = menuItemConstructor(template);

    // when a section is selected, all others are closed
    item.selected.onChange((selected) => {
      if (selected) closeOtherMenuItems(item.id);
    });

    listMenuItems.add(item);
    return item;
  };

  const setSectionSelected = (state) => (sectionName) => listMenuItems.find((item) => item.section.getValue() == sectionName).selected.setValue(state);

  // open a section
  const open = setSectionSelected(true);
  // close a section
  const close = setSectionSelected(false);
  // return a MenuItem based on the section name
  const section = (name) => listMenuItems.find((item) => item.section.getValue() == name);

  /**
   * Initialisation of the menu
   */
  const init = () => {
    ALL_SECTIONS.forEach(addMenuItem);          // create and render all menu items
    open(properties.SECTION_SPLASH);            // open the splash section
    state.setValue(properties.STATE_NONE);      // hide the menu
  };

  const closeOtherMenuItems = (id) => {
    listMenuItems
      .getList()
      .filter((menuItem) => menuItem.id != id)
      .forEach((menuItem) => menuItem.selected.setValue(false));
  };

  return {
    init,
    addMenuItem,
    onAddMenuItem: listMenuItems.onAdd,
    open,
    close,
    state,
    section,
  };
};


/**
 * MenuView
 * @param {Object} menuController 
 * @param {Object} splashController - needed to run the opening or closure scripts
 * @param {Object} helpController   - needed to run the opening or closure scripts
 * @param {Object} gameController   - needed to run the opening or closure scripts
 * @param {HTMLElement} rootElt 
 * @param {HTMLElement} menuElt 
 */
const MenuView = (menuController, splashController, helpController, gameController, rootElt, menuElt) => {
  const render = (model) => menuProjector(menuController, splashController, helpController, gameController, rootElt, menuElt, model);
  // binding 
  menuController.onAddMenuItem(render);
  menuController.state.onChange(setMenuState(menuElt));
};

// main : inject the style used by the projector
(() => {
  addStyle("menuCss", menuProjectorPageCss);
})();
