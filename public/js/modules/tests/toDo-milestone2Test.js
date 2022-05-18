import { tat } from "../test.js";
import { ToDoControler, TodoItemsView, TodoTotalView, TodoOpenView } from "../toDo-milestone2.js";

export {tatResults}

let tatResults=tat('Module TODO milestone2 / test-cases-1', (assert) => {
  const todoContainer = document.createElement("div");
  const numberOfTasksContainer = document.createElement("div");
  const openTasksContainer = document.createElement("div");
  let toDoControler = ToDoControler();
  let todoItemsView = TodoItemsView(toDoControler, todoContainer);
  let todoTotalView = TodoTotalView(toDoControler, numberOfTasksContainer);
  let todoOpenView = TodoOpenView(toDoControler, openTasksContainer);
  toDoControler.addToDo();
  assert.equals(parseInt(numberOfTasksContainer.innerHTML), 1);
  assert.equals(parseInt(openTasksContainer.innerHTML), 1);
  toDoControler.addToDo();
  toDoControler.addToDo();
  assert.equals(parseInt(numberOfTasksContainer.innerHTML), 3);
  assert.equals(parseInt(openTasksContainer.innerHTML), 3);
  assert.equals(todoContainer.childElementCount, 9);

  todoContainer.querySelector('#TASK1_DEL').dispatchEvent(new Event("click"));
  assert.equals(parseInt(openTasksContainer.innerHTML), 2);
  assert.equals(parseInt(numberOfTasksContainer.innerHTML), 2);

  todoContainer.querySelector('#TASK2_CHK').checked=true;
  todoContainer.querySelector('#TASK2_CHK').dispatchEvent(new Event("click"));
  assert.equals(parseInt(openTasksContainer.innerHTML), 1);
  assert.equals(parseInt(numberOfTasksContainer.innerHTML), 2);
}, true);
