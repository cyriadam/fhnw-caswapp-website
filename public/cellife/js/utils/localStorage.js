import { Observable } from "./observable.js";
import * as Log from "./log4js.js";

Log.setLogLevel(Log.LEVEL_ERROR);

let localStorageKey = "cellifeItems";

const persistanceController = (() => {
  const itemList = [];

  const register = (id, value) => {
    Log.debug(`PersistanceController.register(${id}, ${value})`);
    const item = createItem(id, value);
    itemList.push(item);
    return item;
  };

  const createItem = (id, value) => {
    const state = Observable(value);
    return { id, state };
  };

  const persistState = (elemId, value) => {
    Log.debug(`PersistanceController.persistState(${elemId}) : state=${value}`);
    let objJson = {};
    let objLinea = localStorage.getItem(localStorageKey);
    if (objLinea) objJson = JSON.parse(objLinea);
    objJson[elemId] = { state: value };
    localStorage.setItem(localStorageKey, JSON.stringify(objJson));
  };

  const reset = () => localStorage.removeItem(localStorageKey);

  return {
    register,
    persistState,
  };
})();

export const reset = () => localStorage.removeItem(localStorageKey);

export const persistElt = (elem) => {
  if (!(elem.nodeName == "INPUT" && elem.type == "checkbox" && elem.id)) return;

  let checkboxState = elem.checked;
  let objJson = {};
  let objLinea = localStorage.getItem(localStorageKey);
  if (objLinea) {
    objJson = JSON.parse(objLinea);
    checkboxState = objJson[elem.id]?.state;
  }
  elem.checked = checkboxState;

  const toggleItem = persistanceController.register(elem.id, checkboxState);
  toggleItem.state.onChange((value) => persistanceController.persistState(elem.id, value));

  elem.addEventListener("click", (evt) => {
    toggleItem.state.setValue(evt.target.checked);
  });
};

export const persistCheckboxes = (className) => {
  [...document.querySelectorAll(`input[type=checkbox].${className}`)].forEach(persistElt);
};
