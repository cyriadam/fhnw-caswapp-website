import {Observable, ObservableList}                                     from "./observable.js";
import {Attribute, properties as AttrProps}                             from "./presentationModel.js";
import {either, Right, Left, Tuple}                                     from "./lambda.js";
import {Scheduler}                                                      from "./dataflow.js";
import {fortuneService}                                                 from "./fortuneService.js";
import {addStyle}                                                       from "./util.js";

// import {numberProjector, pageCss as  numberProjectorPageCss}         from "./projectors/numberProjector.js";
import {numberProjector, pageCss as  numberProjectorPageCss }           from "./projectors/romanNumberProjector.js";
import {toDoItemProjector, pageCss as toDoItemProjectorPageCss}                                     from "./projectors/toDoItemProjector.js";
import {toDoItemProjector as toDoItemTableProjector, pageCss as toDoItemTableProjectorPageCss}      from "./projectors/toDoItemTableProjector.js";

export { ToDoControler, TodoItemsView, TodoTotalView, TodoOpenView, TodoSaveView, init }

// inject projector styles (accept several pageCss parameters)
((...content)=> {
    if(content.length) {
        const style = document.createElement('STYLE');
        style.setAttribute('id', 'toDoCss');
        style.innerHTML=content.join('\n');
        document.head.appendChild(style);
    }
})(numberProjectorPageCss, undefined);       

let debug=false;
const [Projector, getProjectorName, getProjector, getPageCss] = Tuple(3);

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

    const style = Observable('style1');
    const styles = ( _ => {
        const style1 = Projector('style1', toDoItemProjector, toDoItemProjectorPageCss);
        const style2 = Projector('style2', toDoItemTableProjector, toDoItemTableProjectorPageCss); 
        return [style1, style2];   
    })();

    const createToDoItem = (template) => {
        const done = Observable(template?template.done:false);
        const text = Attribute(template?template.text:"New Task");

        text.setValidator(text=>text.length>3);
        text.setConverter(text=>text.toUpperCase());
        text.save();
        done.onChange(done => text.getObs(AttrProps.EDITABLE).setValue(!done));
        text.getObs(AttrProps.VALUE).onChange( _ => toDoUpdated.setValue(true));

        const toDoItem= {
            id:                     template?template.id:toDoSequence.next().value,
            setText:                text.setConvertedValue,
            getText:                text.getObs(AttrProps.VALUE).getValue,
            onTextChange:           text.getObs(AttrProps.VALUE).onChange,
            onTextValidChange:      text.getObs(AttrProps.VALID).onChange,
            onTextEditableChange:   text.getObs(AttrProps.EDITABLE).onChange,
            getTextValid:           text.getObs(AttrProps.VALID).getValue,
            getTextEditable:        text.getObs(AttrProps.EDITABLE).getValue,
            isDirty:                text.getObs(AttrProps.DIRTY).getValue,
            save:                   text.save,
            reset:                  text.reset,
            getDone:                done.getValue,
            setDone:                done.setValue,
            onDoneChange:           done.onChange,
        };
        return toDoItem;
    }

    return {
        addToDo: (template) => {
            if(debug) console.log(`ToDoControler.addToDo(${JSON.stringify(template)})`);
            const toDoItem=createToDoItem(template);
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
        getTasks: () => toDoList.getList(),
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
        isToDoUpdated: toDoUpdated.getValue,
        switchStyle: () => {
            if(debug) console.log('ToDoControler.switchStyle()');     
            style.setValue(style.getValue()==='style1'?'style2':'style1');     
        },
        onStyleChange: subscriber =>  {
            if(debug) console.log('ToDoControler.onStyleChange()');
            style.onChange(styleName => subscriber(styles.find(item => styleName===getProjectorName(item))));         
        }
    }
}   

const TodoItemsView = (toDoControler, todoContainer) => {
    let currentProjector = undefined;
    const render = (toDoItem) => {
        if(debug) console.log('TodoItemsView.render()');
        currentProjector(toDoControler, todoContainer, toDoItem);
    }

    // binding : controler -> render
    toDoControler.onAddToDo(render);

    toDoControler.onStyleChange(style => {
        if(debug) console.log(`Apply style: ${getProjectorName(style)}`);
        addStyle('toDoItemCss',getPageCss(style));

        const shadowCopy = [];
        toDoControler.getTasks().forEach(task => {
            task.save();                            // persist the state
            shadowCopy.push({id: task.id, text: task.getText(), done:task.getDone()});
        });
        shadowCopy.forEach(task => toDoControler.delToDo(task.id));
        todoContainer.innerHTML = '';
        currentProjector=getProjector(style);
        shadowCopy.forEach(toDoControler.addToDo); 
    })
}


const TodoTotalView = (toDoControler, numberOfTasks) => {
    const render = () => {
        if(debug) console.log('TodoTotalView.render()');
        numberProjector(numberOfTasks, toDoControler.getCountToDo());
    }

    // binding : controler -> render
    toDoControler.onAddToDo(render);
    toDoControler.onDelToDo(render);
}


const TodoOpenView = (toDoControler, openTasks) => {
    const render = () => {
        if(debug) console.log('TodoOpenView.render()');
        numberProjector(openTasks, toDoControler.getCountToDoOpen());
    }

    // binding : controler -> render
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

    // binding : controler -> render
    toDoControler.onToDoUpdated(render);
    toDoControler.onDelToDo(render);
    toDoControler.onAddToDo(render);
}

