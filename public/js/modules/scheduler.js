// execute asynchronous tasks in strict sequence, aka "reactive stream", "flux architecture"
export const Scheduler = () => {
  let inProcess = false;
  const tasks = [];
  function process() {
    if (inProcess) {
      return;
    }
    if (tasks.length === 0) {
      return;
    } // guard clause
    inProcess = true;
    const task = tasks.pop();

    new Promise((resolve, reject) => {
      task(resolve);
    }).then(() => {
      inProcess = false;
      process();
    });
  }
  function add(task) {
    tasks.unshift(task);
    process();
  }
  return {
    add: add,
    addOk: (task) =>
      add((ok) => {
        task();
        ok();
      }), // convenience
  };
};
