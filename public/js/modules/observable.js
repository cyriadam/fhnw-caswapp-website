export const Observable = (value) => {
  const listerners = [];    // ICI : What about to put the listeners in a map and return a tocken when subscribing ?

  const remove = array => subscriber => {       // ICI : lambda : code modulaire, no ref to listerners array so flexible
    const index = array.indexOf(subscriber);
    if (index >= 0) { 
      array.splice(index, 1);
      // console.log(`Observable2 ==> remove index=${index} (count=${listerners.length})`);
    } 
  }

  const listenersRemove = remove(listerners);

  const setValue = (newValue) => {
    if(value===newValue) return;
    const oldValue = value;
    value=newValue;
    const safeIterate = [...listerners]; 
    safeIterate.forEach((subscriber) => subscriber(value, oldValue, () => listenersRemove(subscriber)));
  }

  const onChange = (subscriber) => {
    // console.log(`Observable2 ==> add a new subscriber in listerners (count=${listerners.length})`)
    listerners.push(subscriber);
    subscriber(value, value, () => listenersRemove(subscriber));
    return () => listenersRemove(subscriber)
  }

  return {
    setValue,
    getValue: () => value,
    onChange,
  }
}

// export const Observable = (value) => {
//   const listerners = [];

//   const removeAt     = array => index => array.splice(index, 1);
//   const listenersRemove = removeAt(listerners);

//   const setValue = (newValue) => {
//     if(value===newValue) return;
//     const oldValue = value;
//     value=newValue;
//     const safeIterate = [...listerners];  // shallow copy as we might change listeners array while iterating
//     safeIterate.forEach((subscriber, index) => subscriber(value, oldValue, () => listenersRemove(index)));
//   }

//   const onChange = (subscriber) => {
//     // console.log(`Observable ==> add a new subscriber in listerners (count=${listerners.length})`)
//     listerners.push(subscriber);
//     subscriber(value, value);
//   }

//   return {
//     setValue,
//     getValue: () => value,
//     onChange,
//   }
// }

export const ObservableList = (list) => {
  const onAddListeners = [];
  const onDelListeners = [];

  const add = (item) => {
    // if(list.indexOf(item)!=-1) return; // list can contain doublons
    list.push(item);
    onAddListeners.forEach(subscriber=>subscriber(item));
  }

  const del = (item) => {
    const i = list.indexOf(item);
    if(i!=-1) list.splice(i, 1);
    onDelListeners.forEach(subscriber=>subscriber(item));
  }

  return {
    getList: () => list,
    onAdd: subscriber => {
      onAddListeners.push(subscriber)
      // console.log(`ObservableList ==> add a new subscriber in onAddListeners (count=${onAddListeners.length})`)
    },
    onDel: subscriber =>  {
      onDelListeners.push(subscriber)
      // console.log(`ObservableList ==> add a new subscriber in onDelListeners (count=${onDelListeners.length})`)
    },
    add,
    del,
    count: () => list.length,
    countIf: (pre) => list.reduce((sum, item) => (pre(item)?sum+1:sum), 0),
  }
}