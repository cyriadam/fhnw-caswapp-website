import { tat } from "./../test.js";
import { ToDoView } from "./../toDo.js";

export {tatResults}

let tatResults=tat('Module TODO v3 / test-cases-1', (assert) => {
  const todoContainer = document.createElement("div");
  const numberOfTasksContainer = document.createElement("div");
  const openTasksContainer = document.createElement("div");
  let toDoView = ToDoView(todoContainer, numberOfTasksContainer, openTasksContainer);
  toDoView.newToDo();
  assert.equals(parseInt(numberOfTasksContainer.innerHTML), 1);
  assert.equals(parseInt(openTasksContainer.innerHTML), 1);
  toDoView.newToDo();
  toDoView.newToDo();
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
