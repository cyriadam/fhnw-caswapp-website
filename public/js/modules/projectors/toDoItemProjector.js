import {dom} from './../util.js';

export { toDoItemProjector, pageCss }

let debug=false;

const toDoTextProjector = (item) => {
  let inputItem = dom(`<input id="TASK${item.id}_TXT" type="text" size="42" value='${item.getText()}'>`);
  // -- binding GUI -> Model
  inputItem.oninput=( _ => item.setText(inputItem.value));
  // -- binding Model -> GUI
  item.onTextChange((val) => inputItem.value=val);
  item.onTextEditableChange((editable)=>editable?inputItem.removeAttribute("readonly"):inputItem.setAttribute("readonly", "true"));
  item.onTextValidChange((valid)=>valid?inputItem.setCustomValidity(''):inputItem.setCustomValidity('The text is invalid'));
  return inputItem;
}

const toDoDoneProjector = (item) => {
  let checkboxItem = dom(`<input id="TASK${item.id}_CHK" type="checkbox" ${item.getDone()?'checked':''}>`);
  // -- binding GUI -> Model
  checkboxItem.onclick=((e) => item.setDone(e.target.checked));
  // -- binding Model -> GUI
  // item.onDoneChange(status=>checkboxItem.checked = status);  // Not needed : there are not business logic to change the done outside of the GUI
  return checkboxItem;
}

const toDoDelProjector = (toDoControler, todoContainer, item) => {
  let delButtonItem = dom(`<button id="TASK${item.id}_DEL" class="btn delete">&times;</button>`);
  // binding GUI -> Controler
  delButtonItem.onclick=( _ => {
    toDoControler.delToDo(item.id);
    todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}_DEL`));
    todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}_TXT`));
    todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}_CHK`));
  });
  return delButtonItem;
}

// Create the GUI and do the binding with the MODEL  
// GUI elements are binded to the controller
const toDoItemProjector = (toDoControler, todoContainer, todoItem) => {
  if(debug) console.log('toDoItemProjector.renderToDoItem()');

  let inputItem = toDoTextProjector(todoItem);
  let checkboxItem = toDoDoneProjector(todoItem);
  let delButtonItem = toDoDelProjector(toDoControler, todoContainer, todoItem)

  todoContainer.appendChild(delButtonItem);
  todoContainer.appendChild(inputItem);
  todoContainer.appendChild(checkboxItem);
}

const pageCss = `
  #todoContainer {
    display: grid;
    gap: 0.5em;
    grid-template-columns: 2em auto auto;
    margin-bottom: 0.5em;
  }
  .delete {
    padding: 5px 10px;
    color: red;
    font-size: 1em;
  }
  input[type="text"] {
    font-family: "Comic Sans MS", cursive, sans-serif;
    font-size: 1.1em;
    color: darkblue;
    border-width: 0 0 1px 0;
  }
  input[type="text"]:focus {
    border-color: orange;
    outline: transparent none 0;
  }
  input[type="text"]:read-only {
    color: #c7c7c7;
  }
  input[type="text"]:invalid {
    color: red;
  }
`;