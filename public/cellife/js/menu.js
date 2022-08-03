import { menuProjector, setMenuState, pageCss as menuProjectorPageCss } from "./projectors/menuProjector.js";
import { addStyle, sequence } from "./utils/general.js";
import { ObservableList, Observable } from "./utils/observable.js";
import { Attribute, properties as propertiesAttr } from "./utils/presentationModel.js";
import { Tuple } from "./utils/lambda.js";
import * as Log from "./utils/log4js.js";

export { MenuController, MenuView, MenuModel, properties, MenuItem };

Log.setLogLevel(Log.LEVEL_ERROR);

const properties = {
  STATE_VISIBLE: "visible",
  STATE_HIDDEN: "hidden",
  STATE_NONE: "none",
  SECTION_SPLASH: "section-splash",
  SECTION_GAME: "section-game",
  SECTION_HOF: "section-hof",
  SECTION_HELP: "section-help",
  SECTION_SETTINGS: "section-settings",
  SECTION_ADMIN: "section-admin",
};

const [MenuItem, getMenuName, getMenuSection, getMenuScriptOpen, getMenuScriptClose, getMenuState] = Tuple(5);
const splash = MenuItem("Splash", properties.SECTION_SPLASH, "splashController.openSection", "splashController.closeSection", properties.STATE_NONE);
const game = MenuItem("Game", properties.SECTION_GAME, "gameController.openSection", "stopSound", properties.STATE_VISIBLE);
const hof = MenuItem("Hall Of Fame", properties.SECTION_HOF, 'playSound("STARSWAR.WAV", 1, "toggleMusic")', "stopSound", properties.STATE_VISIBLE);
const help = MenuItem("Help", properties.SECTION_HELP, "helpController.openSection", "helpController.closeSection", properties.STATE_VISIBLE);
const settings = MenuItem("Settings", properties.SECTION_SETTINGS, undefined, undefined, properties.STATE_VISIBLE);
const admin = MenuItem("Admin", properties.SECTION_ADMIN, undefined, undefined, properties.STATE_HIDDEN);

const ALL_SECTIONS = [splash, game, hof, help, settings, admin];

const menuItemIdSequence = sequence();

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
    id,
    text: textAttr,
    section: sectionAttr,
    selected,
    state,
    scriptOpen,
    scriptClose,
    toString: () =>
      "" +
      `${textAttr.getObs(propertiesAttr.NAME).getValue()} = [${textAttr.getValue()}], ` +
      `${sectionAttr.getObs(propertiesAttr.NAME).getValue()} = [${sectionAttr.getValue()}]`,
  };
};

const MenuController = (menuItemConstructor) => {
  const state = Observable(properties.STATE_VISIBLE);
  const listMenuItems = ObservableList([]);

  const addMenuItem = (template) => {
    Log.debug(`MenuController.addMenuItem(${getMenuName(template)})`);
    const item = menuItemConstructor(template);

    item.selected.onChange((selected) => {
      if (selected) closeOtherMenuItems(item.id);
    });

    listMenuItems.add(item);
    return item;
  };

  const setSectionSelected = (state) => (sectionName) => listMenuItems.find((item) => item.section.getValue() == sectionName).selected.setValue(state);
  const open = setSectionSelected(true);
  const close = setSectionSelected(false);
  const section = (name) => listMenuItems.find((item) => item.section.getValue() == name);

  const init = () => {
    ALL_SECTIONS.forEach(addMenuItem);
    // open the splash section
    open(properties.SECTION_SPLASH);
    state.setValue(properties.STATE_NONE);
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

const MenuView = (menuController, splashController, helpController, gameController, rootElt, menuElt) => {
  const render = (model) => menuProjector(menuController, splashController, helpController, gameController, rootElt, menuElt, model);
  // binding
  menuController.onAddMenuItem(render);
  menuController.state.onChange(setMenuState(menuElt));
};

// main
(() => {
  addStyle("menuCss", menuProjectorPageCss);
})();
