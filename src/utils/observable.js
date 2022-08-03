const { makeObj } = require("./general");

const Observable = (value) => {
  const listerners = []; // ICI : What about to put the listeners in a map and return a tocken when subscribing ?
  let enable = true;

  const remove = (array) => (subscriber) => {
    // ICI : lambda : code modulaire, no ref to listerners array so flexible
    const index = array.indexOf(subscriber);
    if (index >= 0) {
      array.splice(index, 1);
      //   console.log(`Observable ==> remove index=${index} (count=${listerners.length})`);
    }
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
    // console.log(`Observable ==> add a new subscriber in listerners (count=${listerners.length})`)
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

const ObservableList = (list) => {
  const onAddListeners = [];
  const onDelListeners = [];

  const add = (item) => {
    // if(list.indexOf(item)!=-1) return; // list can contain doublons
    list.push(item);
    onAddListeners.forEach((subscriber) => subscriber(item));
  };

  const del = (item) => {
    const i = list.indexOf(item);
    if (i != -1) list.splice(i, 1);
    onDelListeners.forEach((subscriber) => subscriber(item));
  };

  return {
    getList: () => list,
    onAdd: (subscriber) => {
      onAddListeners.push(subscriber);
      console.log(`ObservableList ==> add a new subscriber in onAddListeners (count=${onAddListeners.length})`);
    },
    onDel: (subscriber) => {
      onDelListeners.push(subscriber);
      console.log(`ObservableList ==> add a new subscriber in onDelListeners (count=${onDelListeners.length})`);
    },
    add,
    del,
    clear: () => (list.length = 0),
    count: () => list.length,
    countIf: (pre) => list.reduce((sum, item) => (pre(item) ? sum + 1 : sum), 0),
    find: (pre) => list.find(pre),
  };
};

// get the whole model on change
const ObservableObject = (model) => {
  const rawValue = Observable(JSON.stringify(model));
  const observables = {};

  const hasObs = (name) => observables.hasOwnProperty(name);

  const getObs = (name, initialValue = null) => {
    return hasObs(name) ? observables[name] : (observables[name] = Observable(initialValue));
  };

  Object.keys(model).forEach((key) => {
    const obs = getObs(key, model[key]);
    obs.onChange((val, oldVal) => {
      // console.log(`${key} updated [${oldVal}]->[${val}]`);
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
/** test cases ** 
    const moi = ObservableObject({name:'adam', prenom:'cyril'});
    moi.onChange(val=>console.log('[IICI] moi is updated :', JSON.stringify(val)));
    moi.getObs('age').onChange(val=>console.log(`[IICI] age = ${val}`));
    moi.getObs('prenom').setValue('cyrille');
    moi.getObs('age').setValue(54);
    moi.getObs('age').setValue(30);
    moi.getObs('prenom').setValue('jean-cyrille');
    moi.setValue({name: 'adams', prenom: 'cyrille jean', address: 'sierentz', age:54});
    moi.getObs('prenom').setValue('cyril');
    moi.getObs('name').setValue('adam');
    moi.getObs('address').onChange(val=>console.log(`[IICI] address = ${val}`));
/* */

// get all model properties on change
const ObservableObjectProperties = (model) => {
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
/** test cases ** 
    const dataPool = ObservableObjectProperties({var1:1, var2:2, var3:undefined});
    dataPool.setValue({var3:'toto'});
    dataPool.setValue({var4:undefined});
    const rmSubscription1 = dataPool.onChange(val => console.log(`[IICI-1] get(${JSON.stringify(val)})`));
    const rmSubscription2 = dataPool.onChange(val => console.log(`[IICI-2] get(${JSON.stringify(val)})`));
    const rmSubscription3 = dataPool.onChange(val => console.log(`[IICI-3] get(${JSON.stringify(val)})`));
    dataPool.setValue({var2:dataPool.getValue('var2')+1});
    rmSubscription2();
    dataPool.setValue({var4:random(1000)});
    console.log(`[IICI-4] model=[${JSON.stringify(dataPool.getModel())}]`);
    dataPool.setValue({var5:'hello', var6:'world'});
    dataPool.setValue({var5:'hi'});
    console.log(`[IICI-4] model=[${JSON.stringify(dataPool.getModel())}]`);
/* */

module.exports = { Observable, ObservableList, ObservableObject, ObservableObjectProperties };
