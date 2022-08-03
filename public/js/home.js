import { Observable } from "./modules/observable.js";
import { io } from "./modules/client-dist/socket.io.esm.min.js";

export { HomeView }

let debug=false;
let localStorageKey = 'toggleItems';

const HomeControler = () => {
  const toggleList = [];
  // localStorage.removeItem(localStorageKey);
  const socket = io();
  const lanSpeed = Observable(-1);
  const lanMsg = Observable();
  let intervalId;
 
  // ------------
  // server (emit) -> client (receive) - message
  socket.on('connect_error', (err) => console.log('Error connecting to server...'));
  socket.on('message', (msgData) => lanMsg.setValue(msgData));
  socket.on('pong', (msgData) => lanSpeed.setValue(new Date().getTime()-msgData.time));

  // emit with acknowledgement callback -run when the event is acknowledged by the server
  const emitPing = (callBack) => {if (socket.connected) socket.emit('ping', {time:new Date().getTime()}, callBack)};

  emitPing();
  intervalId = setInterval(()=>{
    emitPing((error) => {
        if(error) console.log(`emitPing error: ${error}`);
    }); 
  }, 3000);
  // ------------

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
      onLanMsgChange: lanMsg.onChange,
      onLanSpeedChange: lanSpeed.onChange,
  }
}

const HomeView = () => {
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

  if(debug) homeControler.onLanMsgChange((msgData) => msgData&&console.log(`Get [${msgData.message}] in ${new Date().getTime()-msgData.createdAt}ms`));

  return {
    addToggle,
    addLanSpeed: (elem) => homeControler.onLanSpeedChange((lanSpeed) => { elem.innerHTML=lanSpeed }),
  } 
}
