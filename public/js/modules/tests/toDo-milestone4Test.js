import { tat } from "../test.js";
import { ToDoControler, TodoItemsView, TodoTotalView, TodoOpenView } from "../toDo-milestone4.js";

export { tatResults };

let tatResults = tat(
  "ToDo / Module ToDoController",
  (assert) => {
    const todoContainer = document.createElement("div");
    const numberOfTasksContainer = document.createElement("div");
    const openTasksContainer = document.createElement("div");
    let toDoControler = ToDoControler();
    let todoItemsView = TodoItemsView(toDoControler, todoContainer);
    let todoTotalView = TodoTotalView(toDoControler, numberOfTasksContainer);
    let todoOpenView = TodoOpenView(toDoControler, openTasksContainer);

    toDoControler.addToDo();
    assert.equals(toDoControler.getCountToDo(), 1);
    assert.equals(toDoControler.getCountToDoOpen(), 1);
    toDoControler.addToDo();
    toDoControler.addToDo();
    assert.equals(toDoControler.getCountToDo(), 3);
    assert.equals(toDoControler.getCountToDoOpen(), 3);

    todoContainer.querySelector("#TASK1_DEL").dispatchEvent(new Event("click"));
    assert.equals(toDoControler.getCountToDo(), 2);
    assert.equals(toDoControler.getCountToDoOpen(), 2);

    todoContainer.querySelector("#TASK2_CHK").checked = true;
    todoContainer.querySelector("#TASK2_CHK").dispatchEvent(new Event("click"));
    assert.equals(toDoControler.getCountToDo(), 2);
    assert.equals(toDoControler.getCountToDoOpen(), 1);
  },
  true
);
