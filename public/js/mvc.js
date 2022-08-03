let toDoView;
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

const ToDoControler = () => {
  const nameAttr = Observable("");
  return {
    onNameChange: nameAttr.onChange,
    setName: nameAttr.setValue,
    getName: nameAttr.getValue(),
  };
};

const ToDoView = (nameContainer, nameLgContainer, nameUpperContainer) => {
  const toDoControler = ToDoControler();

  const renderNameLg = (value) => {
    // console.log(`renderNameLg(${value}):${value.length}`)
    nameLgContainer.innerHTML = value.length;
  };

  const renderNameUpper = (value) => {
    // console.log(`renderNameUpper(${value}):${value.toUpperCase()}`)
    nameUpperContainer.innerHTML = value.toUpperCase();
  };

  toDoControler.onNameChange(renderNameLg);
  toDoControler.onNameChange(renderNameUpper);
  toDoControler.setName(nameContainer.value);

  // -- sol1--
  // nameContainer.onchange = (e) => toDoControler.setName(e.target.value);

  return {
    setName: toDoControler.setName,
  };
};

// --- business functions ----

const doSomething = (name) => {
  console.log("some business logic...");
  toDoView.setName(name);
};
