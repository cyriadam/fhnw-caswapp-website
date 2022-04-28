
runTests=tat('Module MVC v0 / test-cases-1', (assert) => {
    const name = document.createElement("input");
    const nameLg = document.createElement("div");
    const nameUpper = document.createElement("div");
    const toDoView = ToDoView(name, nameLg, nameUpper);
    //
    assert.equals(name.value, "");
    assert.equals(parseInt(nameLg.innerHTML), 0);
    assert.equals(nameUpper.innerHTML, "");
    //
    const newValue='Hello World';
    name.value=newValue;
    name.onchange=()=>{
        toDoView.setName(name.value);
    }
    name.dispatchEvent(new Event("change"));
    //
    assert.equals(parseInt(nameLg.innerHTML), newValue.length);
    assert.equals(nameUpper.innerHTML, newValue.toUpperCase());
}, true);



const someTests = () => {
    // --------------------
    const name = "";
    const nameAttribute = Observable(name);
    console.log(`name=[${nameAttribute.getValue()}]`);

    const process1 = (value) => {
      console.log(`run process1(value=[${value}])`);
    }
    const process2 = (value) => {
      console.log(`run process2(value=[${value}])`);
    }
    const process3 = (value) => {
      console.log(`run process3(value=[${value}])`);
    }

    nameAttribute.onChange(process1);
    nameAttribute.onChange(process2);
    // nameAttribute.onChange(process3);

    nameAttribute.setValue("hello")
    nameAttribute.setValue("world")
    nameAttribute.setValue("world")

    const delay = ms => new Promise(res => setTimeout(res, ms));

    // const yourFunction = (async () => {
    //   await delay(1000);
    //   console.log("Waited 1s");
    //   await delay(1000);
    //   console.log("Waited an additional 1s");
    // })();

    // (async () => {
    //   for(i=0; i<5; i++) {
    //     console.log(`-loop(${i})`);
    //     await delay(1000);
    //     nameAttribute.setValue(`name${i}`)
    //   }
    // })();

    // console.log('-1-')
    // var start = new Date().getTime(); 
    // do {} while(new Date().getTime()<(start+2000));   // wait 2 sec -- bloquant everything 
    // console.log('-2-')

    (async () => {
      for(i=0; i<3; i++) {
        await new Promise((resolve, reject)  => {
          setTimeout((i) => {
            console.log(`timeout(${i})`);
            nameAttribute.setValue(`name${i}`)
            resolve();
          }, 1000, i, resolve);
        });
      }
    })();
}
