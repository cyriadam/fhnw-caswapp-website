
const Observable = (value) => {
  const listerners = [];

  const setValue = (newValue) => {
    if(value===newValue) return;
    const oldValue = value;
    value=newValue;
    listerners.forEach(subscriber => subscriber(value, oldValue));
  }

  const onChange = (subscriber) => {
    listerners.push(subscriber);
    subscriber(value, value);
  }

  return {
    setValue,
    getValue: () => value,
    onChange,
  }
}

const ObservableList = (list) => {
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
      console.log(`==> add a new subscriber in onAddListeners (count=${onAddListeners.length})`)
    },
    onDel: subscriber =>  {
      onDelListeners.push(subscriber)
      console.log(`==> add a new subscriber in onDelListeners (count=${onDelListeners.length})`)
    },
    add,
    del,
    count: () => list.length,
    countIf: (pre) => list.reduce((sum, item) => (pre(item)?sum+1:sum), 0),
  }
}