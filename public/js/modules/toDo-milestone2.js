import {Observable, ObservableList} from "./observable.js";
import {Attribute}                  from "./presentationModel_v1.js";
import {either, Right, Left}        from "./lambda.js";
import {Scheduler}                  from "./dataflow.js";
import {fortuneService}             from "./fortuneService.js";

export { ToDoControler, TodoItemsView, TodoTotalView, TodoOpenView, TodoSaveView, init }

let debug=false;

const init = (tatResults) => {
  either(
      !tatResults.every(item=>item) ? Left("tat errors detected") : Right("ok")
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
    const toDoUpdated = Observable(false);

    const createToDoItem = () => {
        const done = Observable(false);
        const text = Attribute("New Task");

        text.setValidator(text=>text.length>3);
        text.setConverter(text=>text.toUpperCase());
        text.save();
        done.onChange( done => text.setTextEditable(!done));


        const toDoItem= {
            id:toDoSequence.next().value,
            setText: (val) => text.setConvertedText(val),
            getText: () => text.getText(),
            onTextChange: (subscriber) => text.onTextChange(subscriber),
            onTextValidChange: (subscriber) => text.onTextValidChange(subscriber),
            onTextEditableChange: (subscriber) => text.onTextEditableChange(subscriber),
            getTextValid: () => text.getTextValid(),
            getTextEditable: () => text.getTextEditable(),
            isDirty: text.isDirty,
            save:text.save,
            reset:text.reset,

            getDone: () => done.getValue(),
            setDone: (val) => done.setValue(val),
            onDoneChange: (subscriber) => done.onChange(subscriber),
        };
        return toDoItem;
    }

    return {
        addToDo: () => {
            if(debug) console.log('ToDoControler.addToDo()');
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
                    toDoItem.save();
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
            toDoList.getList().forEach(task => console.log(`Task(${task.id})=[${task.getText()}], valid=${String(task.getTextValid())}, editable=${String(task.getTextEditable())}, dirty=${String(task.isDirty())}`));
        },
        saveTasks: () => {
            if(debug) console.log('ToDoControler.saveTasks()');
            toDoList.getList().forEach(task => { if(task.isDirty()) task.save() });
            toDoUpdated.setValue(false);
        },
        resetTasks: () => {
            if(debug) console.log('ToDoControler.resetTasks()');
            toDoList.getList().forEach(task => { if(task.isDirty()) task.reset() });
            toDoUpdated.setValue(false);
        },
        onToDoUpdated: subscriber => {
            if(debug) console.log('ToDoControler.onToDoUpdated()');
            toDoUpdated.onChange(subscriber);
        },
        setToDoUpdated: (state=true) => {
            if(debug) console.log(`ToDoControler.setToDoUpdated(${state})`);
            toDoUpdated.setValue(state);
        },
        isToDoUpdated: toDoUpdated.getValue,
    }
}


const TodoItemsView = (toDoControler, todoContainer) => {

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

        item.onTextChange( _ => toDoControler.setToDoUpdated());
    }

    const removeRenderToDoItem = (item) => {
        if(debug) console.log(`delete render item ${item.id}`);
        todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}_DEL`));
        todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}_TXT`));
        todoContainer.removeChild(todoContainer.querySelector(`#TASK${item.id}_CHK`));
    }

    // binding
    toDoControler.onAddToDo(renderToDoItem);
    toDoControler.onDelToDo(removeRenderToDoItem);
}

const TodoTotalView = (toDoControler, numberOfTasks) => {
    const render = () => {
        if(debug) console.log('TodoTotalView.render()');
        numberOfTasks.innerHTML=toDoControler.getCountToDo();
    }

    // binding
    toDoControler.onAddToDo(render);
    toDoControler.onDelToDo(render);
}

const TodoOpenView = (toDoControler, openTasks) => {
    const render = () => {
        if(debug) console.log('TodoOpenView.render()');
        openTasks.innerHTML=toDoControler.getCountToDoOpen();
    }

    // binding
    toDoControler.onAddToDo(item=>{
        item.onDoneChange(render);
        render();
    });
    toDoControler.onDelToDo(render);
}

const TodoSaveView = (toDoControler, saveBtn, resetBtn) => {
    const render = () => {
        if(debug) console.log(`TodoSaveView.render()`);

        // rem: could be replaced by either : either( !(toDoControler.isToDoUpdated()&&toDoControler.getCountToDo()!=0)) ? Left() : Right() )
        (toDoControler.isToDoUpdated()&&toDoControler.getCountToDo()!=0) ? ( _ => {
            saveBtn.removeAttribute("disabled");
            resetBtn.removeAttribute("disabled");
        })() :
        ( _ => {
            saveBtn.setAttribute('disabled', 'true');
            resetBtn.setAttribute('disabled', 'true');
        })();
    }

    // binding
    toDoControler.onToDoUpdated(render);
    toDoControler.onDelToDo(render);
    toDoControler.onAddToDo(render);
}


