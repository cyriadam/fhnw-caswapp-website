let toDoView;
let debug = false;
let runTests;

const init = () => {
  either(
    (() => {
      return !runTests.every((item) => item) ? Left("game engine errors detected") : Right("ok");
    })()
  )((err) => {
    alert(err);
  })((err) => {
    console.log("Success : " + err);
  });
};

function* sequence() {
  let i = 0;
  while (true) yield ++i;
}

const ToDoControler = () => {
  const toDoList = ObservableList([]);
  const toDoSequence = sequence();

  const createToDoItem = () => {
    const done = Observable(false);
    const toDoItem = {
      id: toDoSequence.next().value,
      label: "...",
      getDone: () => done.getValue(),
      setDone: (val) => done.setValue(val),
      onDoneChange: (subscriber) => done.onChange(subscriber),
    };
    return toDoItem;
  };

  return {
    newToDo: () => {
      if (debug) console.log("ToDoControler.newToDo()");
      const toDoItem = createToDoItem();
      toDoList.add(toDoItem);
      return toDoItem;
    },
    delToDo: (toDoId) => {
      if (debug) console.log(`ToDoControler.delToDo(${toDoId})`);
      const toDoItem = toDoList.getList().find((item) => item.id == toDoId);
      // console.log(toDoItem);
      toDoList.del(toDoItem);
    },
    onAddToDo: (subscriber) => {
      if (debug) console.log("ToDoControler.onAddToDo()");
      toDoList.onAdd(subscriber);
    },
    onDelToDo: (subscriber) => {
      if (debug) console.log("ToDoControler.onDelToDo()");
      toDoList.onDel(subscriber);
    },
    getCountToDo: () => toDoList.count(),
    getCountToDoOpen: () => toDoList.countIf((item) => !item.getDone()),
  };
};

const ToDoView = (todoContainer, numberOfTasks, openTasks) => {
  const toDoControler = ToDoControler();

  const renderStatistics = () => {
    if (debug) console.log("ToDoView.renderStatistics()");
    numberOfTasks.innerHTML = toDoControler.getCountToDo();
    openTasks.innerHTML = toDoControler.getCountToDoOpen();
  };

  const createElements = (item) => {
    const template = document.createElement("DIV"); // only for parsing
    template.innerHTML = `
            <button id="TASK${item.id}_DEL" class="btn delete">&times;</button>
            <input id="TASK${item.id}_TXT" type="text" size="42" value='${item.label}'>
            <input id="TASK${item.id}_CHK" type="checkbox" ${item.getDone() ? "checked" : ""}>            
        `;
    return template.children;
  };

  const renderToDoItem = (item) => {
    if (debug) console.log("ToDoView.renderToDoItem()");
    [delButtonItem, inputItem, checkboxItem] = createElements(item);

    checkboxItem.onclick = (e) => {
      item.setDone(e.target.checked);
    };

    delButtonItem.onclick = (e) => {
      // console.log(e.target.id);
      const taskId = e.target.id.match(/^TASK(.*)_DEL$/)[1]; // https://regex101.com/
      toDoControler.delToDo(parseInt(taskId));
    };

    todoContainer.appendChild(delButtonItem);
    todoContainer.appendChild(inputItem);
    todoContainer.appendChild(checkboxItem);
  };

  const removeRenderToDoItem = (item) => {
    if (debug) console.log(`delete render item ${item.id}`);
    todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}_DEL`));
    todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}_TXT`));
    todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}_CHK`));
  };

  const newToDo = () => {
    const toDoItem = toDoControler.newToDo();
    toDoItem.onDoneChange(renderStatistics);
  };

  toDoControler.onAddToDo(renderStatistics);
  toDoControler.onDelToDo(renderStatistics);
  toDoControler.onAddToDo(renderToDoItem);
  toDoControler.onDelToDo(removeRenderToDoItem);

  return {
    newToDo,
  };
};

// --- business functions ----
