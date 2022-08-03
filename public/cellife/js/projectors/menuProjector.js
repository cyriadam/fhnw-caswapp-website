import { dom } from "../utils/general.js";
import * as Log from "../utils/log4js.js";
import { properties } from "../menu.js";
import { playSound, stopSound } from "../utils/general.js";

export { menuProjector, pageCss, setMenuState };

Log.setLogLevel(Log.LEVEL_ERROR);

const masterClassName = "menuItem";

const toDoMenuItemElt = (splashController, helpController, gameController, rootElt, item) => {
  let menuItemElt = dom(`<div class="${masterClassName} btn"><div id="MENUITEM_${item.id}">${item.text.getValue()}</div></div>`);

  // -- binding GUI -> Model
  menuItemElt.onclick = (evt) => {
    if (item.state.getValue() != properties.STATE_VISIBLE) return;
    if (item.selected.getValue()) return; // note : we can only open an item
    item.selected.setValue(!item.selected.getValue());
  };

  // -- binding Model -> GUI
  item.selected.onChange((selected) => {
    Log.debug(`${item.toString()} is ${selected ? "on" : "off"}`);
    let target = menuItemElt.parentNode.querySelector(`#MENUITEM_${item.id}`);
    selected ? target.classList.add("selected") : target.classList.remove("selected");
    let sectionElt = rootElt.querySelector(`#${item.section.getValue()}`);
    selected ? sectionElt.classList.remove("close-section") : sectionElt.classList.add("close-section");
    if (selected && item.scriptOpen) eval(`${item.scriptOpen}()`);
    if (!selected && item.scriptClose) eval(`${item.scriptClose}()`);
  });
  item.state.onChange((state) => {
    Log.debug(`${item.toString()} is ${state}`);
    renderItemState(menuItemElt, state);
  });

  return menuItemElt;
};

const renderItemState = (elt, state) => {
  elt.classList.remove("hidden");
  elt.classList.remove("none");
  if (state == properties.STATE_HIDDEN) elt.classList.add("hidden");
  if (state == properties.STATE_NONE) elt.classList.add("none");
};

const menuProjector = (menuController, splashController, helpController, gameController, rootElt, menuElt, item) => {
  Log.debug(`menuProjector.render(${item.toString()})`);
  let menuItemElt = toDoMenuItemElt(splashController, helpController, gameController, rootElt, item);
  menuElt.insertAdjacentElement("beforeend", menuItemElt);
};

const setMenuState = (menuElt) => (state) => {
  Log.debug(`menuProjector.setMenuState(${state})`);
  renderItemState(menuElt, state);
};

const pageCss = `
  .${masterClassName} {
    width: 160px;

    display:flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    font-weight: normal;
    color: var(--color-grey);

    background: linear-gradient( rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5) ), url("/img/pain-texture.jpg");
    background-size: cover;
  }

  .${masterClassName}:hover {
    font-weight: bold;
    transition: padding 0.1s, box-shadow 0.1s, border-color 0.1s;
  }

  .${masterClassName} .selected {
    font-weight: bold;
    color: var(--color-main);
  }
`;
