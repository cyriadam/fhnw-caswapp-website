/**
 * @module utils/localStorage
 * This module is used to persist in the localStorage the value of HTMLElements
 */

import { Observable } from "./observable.js";
import * as Log from "./log4js.js";

export { reset, persistElt, persistCheckboxes };

Log.setLogLevel(Log.LEVEL_ERROR);

// They key in the localStorage to identify the storage
let localStorageKey = "cellifeItems";

/**
 * persistanceController
 *
 * Note: Self-Invoking Function (Singleton)
 */
const persistanceController = (() => {
  const itemList = []; // collection of persistent object

  /**
   * Save in the collection an persistent object
   * @param {String} id
   * @param {String} value
   * @returns {*} - persistent model type = { id, Observable(value) };
   */
  const register = (id, value) => {
    Log.debug(`PersistanceController.register(${id}, ${value})`);
    const item = createItem(id, value);
    itemList.push(item);
    return item;
  };

  /**
   * Create an persistent object
   * @param {String} id
   * @param {String} value
   * @returns {*} - persistent model type = { id, Observable(value) };
   */
  const createItem = (id, value) => {
    const state = Observable(value);
    return { id, state };
  };

  /**
   * Persist a value in the localStorage
   * 
   * Note: Every value are stored in a global object where the keys corresponds to their ids
   * @param {*} elemId
   * @param {*} value
   */
  const persistState = (elemId, value) => {
    Log.debug(`PersistanceController.persistState(${elemId}) : state=${value}`);
    let objJson = {};
    let objLinea = localStorage.getItem(localStorageKey);
    if (objLinea) objJson = JSON.parse(objLinea);
    objJson[elemId] = { state: value }; // point of interest
    localStorage.setItem(localStorageKey, JSON.stringify(objJson));
  };

  /**
   * Clean the localStorage
   */
  const reset = () => localStorage.removeItem(localStorageKey);

  return {
    reset,
    register,
    persistState,
  };
})();

// --- business functions ---

/**
 * Clean the localStorage
 */
const reset = () => persistanceController.reset();

/**
 * Bind an element of type html checkbox to the persistence
 * @param {HTMLInputElement} elem
 */
const persistElt = (elem) => {
  if (!(elem.nodeName == "INPUT" && elem.type == "checkbox" && elem.id)) return;

  // retrieve from the localstorage if already registered
  let checkboxState = elem.checked;
  let objJson = {};
  let objLinea = localStorage.getItem(localStorageKey);
  if (objLinea) {
    objJson = JSON.parse(objLinea);
    checkboxState = objJson[elem.id]?.state;
  }
  elem.checked = checkboxState;

  const toggleItem = persistanceController.register(elem.id, checkboxState);

  //binding
  toggleItem.state.onChange((value) => persistanceController.persistState(elem.id, value));

  elem.addEventListener("click", (evt) => {
    toggleItem.state.setValue(evt.target.checked);
  });
};

/**
 * Bind all elements from a given class to the persistence
 * @param {*} className
 */
const persistCheckboxes = (className) => {
  [...document.querySelectorAll(`input[type=checkbox].${className}`)].forEach(persistElt);
};
