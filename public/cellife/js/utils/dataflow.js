/**
 * @module utils/dataflow
 * A dataflow abstraction
 */

export { DataFlowVariable, Scheduler };
/**
 * A dataflow abstraction that is not based on concurrency but on laziness
 * @param  {Function} howto - the initialisation function
 */
const DataFlowVariable = (howto) => {
  let value = undefined;
  return () => {
    if (value !== undefined) {
      return value;
    }
    value = howto();
    return value;
  };
};

/**
 *  Execute asynchronous tasks in strict sequence
 */
const Scheduler = () => {
  let inProcess = false;
  const tasks = [];
  function process() {
    if (inProcess) return;
    if (tasks.length === 0) return;
    inProcess = true;
    const task = tasks.pop();
    const prom = new Promise((ok, reject) => task(ok));
    prom.then((_) => {
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
