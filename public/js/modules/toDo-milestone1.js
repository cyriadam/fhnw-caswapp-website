import {Observable, ObservableList} from "./observable.js";
import {either, Right, Left} from "./lambda.js";
import {Scheduler}                  from "./dataflow.js";
import {fortuneService}             from "./fortuneService.js";

export { ToDoView, init }

let toDoView;
let debug=false;

const init = (tatResults) => {
  either(
      (() => {
      return !tatResults.every(item=>item) ? Left("game engine errors detected") : Right("ok");
      })()
  )((err) => {
      alert(err);
  })
  ((err) => {
      console.log('Success : '+err);
  })
}

function * sequence() {
    let i=0;
    while(true) yield ++i; 
}

const ToDoControler = () => {
    const toDoList = ObservableList([]);
    const toDoSequence = sequence();
    const scheduler = Scheduler();

    const createToDoItem = () => {
        const done = Observable(false);
        const text = Observable("New Task");
        const textValid = Observable(true);
        const textEditable = Observable(true);

        text.onChange( text => textValid.setValue(text.length>3));
        done.onChange( done => textEditable.setValue(!done));

        const toDoItem= {
            id:toDoSequence.next().value,
            setText: (val) => text.setValue(val),
            getText: () => text.getValue(),
            onTextChange: (subscriber) => text.onChange(subscriber),
            getDone: () => done.getValue(),
            setDone: (val) => done.setValue(val),
            onDoneChange: (subscriber) => done.onChange(subscriber),
            onTextValidChange: (subscriber) => textValid.onChange(subscriber),
            onTextEditableChange: (subscriber) => textEditable.onChange(subscriber),
            getTextValid: () => textValid.getValue(),
            getTextEditable: () => textEditable.getValue(),
        };
        return toDoItem;
    }

    return {
        newToDo: () => {
            if(debug) console.log('ToDoControler.newToDo()');
            const toDoItem=createToDoItem();
            toDoList.add(toDoItem);
            return toDoItem;
        },
        addFortuneTodo: () => {
            if(debug) console.log('ToDoControler.addFortuneTodo()');
            const toDoItem=createToDoItem();
            toDoItem.setText('...');
            toDoList.add(toDoItem);
            scheduler.add(ok =>
                fortuneService( text => {
                    toDoItem.setText(text);
                    ok();
                })
            );
            return toDoItem;    
        },
        delToDo: (toDoId) => {
            if(debug) console.log(`ToDoControler.delToDo(${toDoId})`);
            const toDoItem = toDoList.getList().find(item=>item.id==toDoId);
            // console.log(toDoItem);
            toDoList.del(toDoItem);
        },
        onAddToDo: (subscriber) => {
            if(debug) console.log('ToDoControler.onAddToDo()');
            toDoList.onAdd(subscriber);
        },
        onDelToDo: (subscriber) => {
            if(debug) console.log('ToDoControler.onDelToDo()');
            toDoList.onDel(subscriber);
        },
        getCountToDo: () => toDoList.count(),
        getCountToDoOpen: () => toDoList.countIf(item=>!item.getDone()),
        listTasks: () => {
            toDoList.getList().forEach(task => console.log(`Task(${task.id})=[${task.getText()}], valid=${String(task.getTextValid())}, editable=${String(task.getTextEditable())}`));
        }
    }
}

const ToDoView = (todoContainer, numberOfTasks, openTasks) => {
    const toDoControler = ToDoControler();

    const renderStatistics = () => {
        if(debug) console.log('ToDoView.renderStatistics()');
        numberOfTasks.innerHTML=toDoControler.getCountToDo();
        openTasks.innerHTML=toDoControler.getCountToDoOpen();
    }

    const createElements = (item) => {
        const template = document.createElement('DIV'); // only for parsing
        template.innerHTML = `
            <button id="TASK${item.id}_DEL" class="btn delete">&times;</button>
            <input id="TASK${item.id}_TXT" type="text" size="42" value='${item.getText()}'>
            <input id="TASK${item.id}_CHK" type="checkbox" ${item.getDone()?'checked':''}>            
        `;
        return template.children;
    }

    const renderToDoItem = (item) => {
        if(debug) console.log('ToDoView.renderToDoItem()');
        let [delButtonItem, inputItem, checkboxItem]=createElements(item);

        checkboxItem.onclick=(e) => {
            item.setDone(e.target.checked);
        }

        delButtonItem.onclick=(e) => {
            // console.log(e.target.id);
            const taskId = e.target.id.match(/^TASK(.*)_DEL$/)[1];      // https://regex101.com/
            toDoControler.delToDo(parseInt(taskId));
        }
        
        todoContainer.appendChild(delButtonItem);
        todoContainer.appendChild(inputItem);
        todoContainer.appendChild(checkboxItem);

        item.onTextChange((val) => inputItem.value=val);
        inputItem.oninput=( _ => item.setText(inputItem.value));

        item.onTextEditableChange((editable)=>editable?inputItem.removeAttribute("readonly"):inputItem.setAttribute("readonly", "true"));
        item.onTextValidChange((valid)=>valid?inputItem.setCustomValidity(''):inputItem.setCustomValidity('The text is invalid'));
    }

    const removeRenderToDoItem = (item) => {
        if(debug) console.log(`delete render item ${item.id}`);
        todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}_DEL`));
        todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}_TXT`));
        todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}_CHK`));
    }

    const newToDo = () => {
        const toDoItem = toDoControler.newToDo();
    }

    const newFortuneTodo = () => {
        const toDoItem = toDoControler.addFortuneTodo();
    }

    toDoControler.onAddToDo(renderStatistics);
    toDoControler.onDelToDo(renderStatistics);
    toDoControler.onAddToDo((item) => {
        item.onDoneChange(renderStatistics);
        renderToDoItem(item);
    });
    toDoControler.onDelToDo(removeRenderToDoItem);

    return {
        newToDo,
        newFortuneTodo,
        listTasks : toDoControler.listTasks,
    } 
}

// --- business functions ----
