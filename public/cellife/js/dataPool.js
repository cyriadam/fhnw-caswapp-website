/**
 * @module dataPool
 * synchronize objects in a client-server architecture 
 */

import { Observable } from "./utils/observable.js";
import { makeObj } from "./utils/general.js";
import * as Log from "./utils/log4js.js";

export { DataPoolController };

Log.setLogLevel(Log.LEVEL_ERROR);

/**
 * DataPoolController
 * 
 * Note : 
 * - the DataPoolController contains 2 observable lists to register the subscribers to notifications from the server and to emit data to the server (wrapped in an object)
 * - for more flexibility, on notification, the data is set to the incoming observables list (if the variable was registered) or directly to html document 
 * @param {*} socket 
 * @returns {Object} { getObsOut(), getObsIn() }
 */
const DataPoolController = (socket) => {
  const obsListOut = {};    // list of observables which will notify the server on change
  const obsListIn = {};     // list of observables to render server notifications

  const hasObs = (obsList) => (name) => obsList.hasOwnProperty(name);
  const getObs =
    (obsList) =>
    (name, initialValue = null) => {
      return hasObs(obsList)(name) ? obsList[name] : (obsList[name] = Observable(initialValue));
    };

  const hasObsOut = hasObs(obsListOut);
  const hasObsIn = hasObs(obsListIn);
  const getObsIn = getObs(obsListIn);

  const getObsOut = (
    (obsList) =>
    (name, initialValue = null) => {
      if (!hasObs(obsList)(name)) {
        const obs = Observable(initialValue);
        obs.onChange((value) => {
          if (value != null) emitSetDataPoolValue(makeObj(name, value));    // the data are wrapped in an object
        });
        obsList[name] = obs;
      }
      return obsList[name];
    }
  )(obsListOut);

  const emitDataPoolSubscribe = (callBack) => {
    Log.debug(`emitDataPoolSubscribe ()`);
    socket.emit("dataPoolSubscribe", callBack);
  };

  const emitSetDataPoolValue = (data, callBack) => {
    Log.debug(`emitSetDataPoolValue (${JSON.stringify(data)})`);
    socket.emit("setDataPoolValue", data, callBack);
  };

  socket.on("init", () => {
    Log.debug(`get('init')`);
    emitDataPoolSubscribe();
  });

  socket.on("dataPoolValue", (data) => {
    Log.debug(`get('dataPoolValue')=${JSON.stringify(data)}`);
    const name = Object.keys(data)[0];
    // set the data to the observables list or directly to html document if exist
    if (hasObsIn(name)) getObsIn(name).setValue(data[name]);
    else {
      let elt = document.getElementById(name);
      if (elt) {
        if (elt instanceof HTMLInputElement) elt.value = data[name];    // point of interest
        else elt.innerHTML = data[name];
      }
    }
  });

  return {
    getObsOut,
    getObsIn,
  };
};
