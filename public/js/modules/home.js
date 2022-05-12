import { Observable } from "./observable.js";

export { HomeView }

let debug=true;
let localStorageKey = 'toggleItems';

const HomeControler = () => {
  const toggleList = [];
  // localStorage.removeItem(localStorageKey);

  const createToggleItem = (id, state) => {
      const collapse = Observable(state);
      return { id, collapse };
  }

  const persistToggleState = (toggleId, toggleState) => {
    if(debug) console.log(`persistToggleState(${toggleId}) : state=${toggleState}`);
    let objJson = {};
    let objLinea = localStorage.getItem(localStorageKey);
    if(objLinea) objJson = JSON.parse(objLinea);
    objJson[toggleId] = { collapse: toggleState };
    localStorage.setItem(localStorageKey,JSON.stringify(objJson));
  }

  return {
      addToggle: (id, state) => {
          if(debug) console.log(`HomeControler.addToggle(${id}, ${state})`);
          const toggleItem=createToggleItem(id, state);
          toggleList.push(toggleItem);
          return toggleItem;
      },
      persistToggleState,

  }
}

const HomeView = (todoContainer, numberOfTasks, openTasks) => {
  const homeControler = HomeControler();

  const addToggle = (elem) => {
    let toggleState = false;
    let objJson = {};
    let objLinea = localStorage.getItem(localStorageKey);
    if(objLinea) {
      objJson = JSON.parse(objLinea);
      toggleState=objJson[elem.id]?.collapse;
    }

    elem.checked=toggleState;
    const toggleItem = homeControler.addToggle(elem.id, toggleState);
    toggleItem.collapse.onChange((value) => homeControler.persistToggleState(elem.id, value));
    elem.onclick=(e) => toggleItem.collapse.setValue(elem.checked);
  }

  return {
    addToggle,
  } 
}
