import { makeObj } from "./general.js";

export const Observable = (value) => {
  const listerners = [];
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

export const ObservableList = (list) => {
  const onAddListeners = [];
  const onDelListeners = [];

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
    countIf: (pre) => list.reduce((sum, item) => (pre(item) ? sum + 1 : sum), 0),
    find: (pre) => list.find(pre),
  };
};

export const ObservableObject = (model) => {
  const rawValue = Observable(JSON.stringify(model));
  const observables = {};

  const hasObs = (name) => observables.hasOwnProperty(name);

  const getObs = (name, initialValue = null) => {
    return hasObs(name) ? observables[name] : (observables[name] = Observable(initialValue));
  };

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
    rawValue.diseable();
    Object.keys(observables).forEach((key) => observables[key].diseable());
    Object.keys(obj).forEach((key) => {
      if (hasObs(key)) observables[key].setValue(obj[key]);
      else observables[key] = Observable(obj[key]);
    });
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
