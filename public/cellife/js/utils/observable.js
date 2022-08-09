/**
 * @module utils/observable
 * interface from the GoF Observable design pattern.
 */

import { makeObj } from "./general.js";

/**
 * Observable for a value
 * Notify a list of subscribers when the value is changed
 *
 * Note : the methods enable() and diseable() are used to desactivate the notification process.
 * - It could be used to preform many updates and notify only once at the end
 *
 * @param {*} value
 */
export const Observable = (value) => {
  const listerners = []; // list of subscribers
  let enable = true;

  const remove = (array) => (subscriber) => {
    const index = array.indexOf(subscriber);
    if (index >= 0) array.splice(index, 1);
  };

  const listenersRemove = remove(listerners);

  const setValue = (newValue) => {
    if (value === newValue) return;
    const oldValue = value;
    value = newValue;
    if (!enable) return;
    const safeIterate = [...listerners];
    safeIterate.forEach((subscriber) => subscriber(value, oldValue, () => listenersRemove(subscriber)));
  };

  const onChange = (subscriber) => {
    listerners.push(subscriber);
    subscriber(value, value, () => listenersRemove(subscriber));
    return () => listenersRemove(subscriber);
  };

  const setEnable = (state = true) => {
    if (enable == state) return;
    enable = state;
    if (enable) [...listerners].forEach((subscriber) => subscriber(value, value, () => listenersRemove(subscriber)));
  };

  return {
    setValue,
    getValue: () => value,
    onChange,
    enable: () => setEnable(true),
    diseable: () => setEnable(false),
  };
};

/**
 * Observable for a list
 * Notify a list of subscribers when an object is added or removed from the list
 *
 * @param {Array} list
 */
export const ObservableList = (list) => {
  const onAddListeners = []; // list of subscribers when an object is added to the list
  const onDelListeners = []; // list of subscribers when an object is removed to the list

  const add = (item) => {
    list.push(item);
    onAddListeners.forEach((subscriber) => subscriber(item));
  };

  const del = (item) => {
    const i = list.indexOf(item);
    if (i != -1) list.splice(i, 1);
    onDelListeners.forEach((subscriber) => subscriber(item));
  };

  const delAll = () => {
    list.forEach(del);
  };

  return {
    getList: () => list,
    onAdd: (subscriber) => onAddListeners.push(subscriber),
    onDel: (subscriber) => onDelListeners.push(subscriber),
    add,
    del,
    delAll,
    clear: () => (list.length = 0),
    count: () => list.length,
    countIf: (pre) => list.reduce((sum, item) => (pre(item) ? sum + 1 : sum), 0), // point of interest
    find: (pre) => list.find(pre), // point of interest
  };
};

/**
 * Observable for an object
 * 
 * Note :
 * - Subscribers are notify when a property of the object is updated and received 'only' the model back
 * - Subscribers can also be added only on a single property
 * - New properties can be added but won't be part of the model
 *
 * @param {Object} model
 *
 * @example
 *
 * const person = ObservableObject({name:'Do', firstname:'John'});
 * person.onChange(val=>console.log('person is updated :', JSON.stringify(val)));
 * person.getObs('firstname').setValue('John1');
 * person.setValue({name:'Do2', firstname:'John2'});
 * person.getObs('age').onChange(val=>console.log(`age = ${val}`));
 * person.getObs('age').setValue(30);
 */
export const ObservableObject = (model) => {
  const rawValue = Observable(JSON.stringify(model));
  const observables = {};

  const hasObs = (name) => observables.hasOwnProperty(name);

  const getObs = (name, initialValue = null) => {
    return hasObs(name) ? observables[name] : (observables[name] = Observable(initialValue));
  };

  /**
   * Initialisation : create the observables for the model
   */
  Object.keys(model).forEach((key) => {
    const obs = getObs(key, model[key]);
    obs.onChange((val, oldVal) => {
      const value = JSON.parse(rawValue.getValue());
      value[key] = val;
      rawValue.setValue(JSON.stringify(value));
    });
  });

  const onChange = (subscriber) => {
    const removeListener = rawValue.onChange((val, oldVal, removeListener) => {
      subscriber(JSON.parse(val), JSON.parse(oldVal), removeListener);
    });
    return removeListener;
  };

  const setValue = (obj) => {
    // disable all observables
    rawValue.diseable();        
    Object.keys(observables).forEach((key) => observables[key].diseable());
    // perform the updates
    Object.keys(obj).forEach((key) => {
      if (hasObs(key)) observables[key].setValue(obj[key]);
      else observables[key] = Observable(obj[key]);
    });
    // enable the observables
    Object.keys(observables).forEach((key) => observables[key].enable());
    rawValue.enable();
  };

  return {
    getObs,
    hasObs,
    onChange,
    setValue,
    getProperties: () => Object.keys(observables),
  };
};


/**
 * Observable for an object properties
 * 
 * Note :
 * - Subscribers are notify when a property of the object is updated 
 * - New properties can be added to the model
 *
 * @param {Object} model
 *
 * @example
 *
 * const car = ObservableObject({brand:'Opel', model:'Corsa'});
 * car.onChange(val=>console.log('car is updated :', JSON.stringify(val)));
 * car.setValue({color:'red'});
 * car.setValue({model: 'Astra' color:'White'});
 * console.log(`model=[${JSON.stringify(car.getModel())}]`);
 */
export const ObservableObjectProperties = (model) => {
  const listerners = [];
  const observables = {};

  const remove = (array) => (subscriber) => {
    const index = array.indexOf(subscriber);
    if (index >= 0) array.splice(index, 1);
  };
  const listenersRemove = remove(listerners);

  const hasObs = (name) => observables.hasOwnProperty(name);
  const getObs = (name, initialValue = null) => {
    return hasObs(name) ? observables[name] : (observables[name] = Observable(initialValue));
  };

  const onChange = (subscriber) => {
    listerners.push(subscriber);
    Object.keys(observables).forEach((key) => {
      const val = observables[key].getValue();
      subscriber(makeObj(key, val), makeObj(key, val), () => listenersRemove(subscriber));
    });
    return () => listenersRemove(subscriber);
  };

  const setValue = (obj) => {
    Object.keys(obj).forEach((key) => {
      if (hasObs(key)) observables[key].setValue(obj[key]);
      else {
        const obs = getObs(key, obj[key]);
        obs.onChange((val, oldVal) => {
          listerners.forEach((subscriber) => subscriber(makeObj(key, val), makeObj(key, oldVal), () => listenersRemove(subscriber)));
        });
      }
    });
  };

  const getValue = (name) => (hasObs(name) ? observables[name].getValue() : undefined);

  /**
   * Initialisation : create the observables for the model
   */
  Object.keys(model).forEach((key) => {
    const obs = getObs(key, model[key]);
    obs.onChange((val, oldVal) => {
      listerners.forEach((subscriber) => subscriber(makeObj(key, val), makeObj(key, oldVal), () => listenersRemove(subscriber)));
    });
  });

  const getModel = () => {
    const entries = [];
    Object.keys(observables).forEach((key) => entries.push([key, observables[key].getValue()]));
    return Object.fromEntries(new Map(entries));
  };

  return {
    getObs,
    hasObs,
    onChange,
    setValue,
    getValue,
    getModel,
    getProperties: () => Object.keys(observables),
  };
};
