import {dom} from '../util.js';

export { toDoItemProjector, pageCss }

let debug=true;
let tableContainer = undefined;

const toDoTextProjector = (item) => {
  let inputItem = dom(`<input id="TASK${item.id}_TXT" type="text" maxlength="100" value='${item.getText()}'>`);
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
    todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}`));
  });
  return delButtonItem;
}


// Create the GUI and do the binding with the MODEL  
// GUI elements are binded to the controller
const toDoItemProjector = (toDoControler, todoContainer, todoItem) => {
  if(debug) console.log('toDoItemTableProjector.renderToDoItem()');

  if(!tableContainer) {
    console.log(todoContainer);
    if(debug) console.log('create the table element');
    const tableElement = dom(`<table id='toDo-table'><tbody><tr><th>Del</th><th>Description</th><th>Done</th></tr></tbody></table>`);
    todoContainer.appendChild(tableElement);
    tableContainer=tableElement.querySelector('tbody');
  }

  let inputItem = toDoTextProjector(todoItem);
  let checkboxItem = toDoDoneProjector(todoItem);
  let delButtonItem = toDoDelProjector(toDoControler, tableContainer, todoItem)
  
  let tableRowElement = dom(`<tr id='TASK${todoItem.id}'><td></td><td></td><td></td></tr>`, 'tbody');
  tableRowElement.querySelector('td:nth-child(1)').appendChild(delButtonItem);
  tableRowElement.querySelector('td:nth-child(2)').appendChild(inputItem);
  tableRowElement.querySelector('td:nth-child(3)').appendChild(checkboxItem);
  tableContainer.appendChild(tableRowElement);
}

const pageCss = `
  #toDo-table {
    border: 1px solid blue;
    border-collapse: collapse;
    width: 100%;
  }
  #toDo-table td, #toDo-table th {
    padding: 3px 0;
  }
  #toDo-table td:first-child, #toDo-table td:last-child {
    width: 80px;
    text-align: center; 
  }
  #toDo-table > tbody > tr:first-child {
    border: 1px solid blue;
  }

  input[type="text"] {
    font-size: 1.1em;
    color: darkblue;
    border-width: 0;
    width:100%;
  }
  input[type="text"]:focus {
    border-width: 0 0 1px 0;
    border-color: orange;
    outline: transparent none 0;
  }
  input[type="text"]:read-only {
    color: #c7c7c7;
  }
  input[type="text"]:invalid {
    color: red;
  }
  button.btn.delete {
    padding: 5px 10px;
    border: 1px solid #c7c7c7;
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
  }
  button.btn.delete:hover {
    cursor:pointer;
  }
`;