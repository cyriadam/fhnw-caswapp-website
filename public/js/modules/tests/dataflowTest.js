import { DataFlowVariable, Scheduler } from "./../dataflow.js";
import { tat } from "./../test.js";

tat(
  "Module Scheduler / test-cases-1",
  (assert) => {
    console.log("running [DataFlowVariable]Test cases...");

    // --- test DataFlowVariable
    const a = DataFlowVariable(() => b() + c()); // z depends on x and y, which are set later...
    const b = DataFlowVariable(() => c()); // x depends on y, which is set later...
    const c = DataFlowVariable(() => 1);

    assert.equals(a(), 2);
    assert.equals(b(), 1);
    assert.equals(c(), 1);

    // value must be set at most once
    let counter = 0;
    const d = DataFlowVariable(() => {
      counter++;
      return 1;
    });
    assert.equals(counter, 0);
    assert.equals(d(), 1);
    assert.equals(counter, 1);
    assert.equals(d(), 1);
    assert.equals(counter, 1);

    // promise must be set at most once
    counter = 0;
    const e = DataFlowVariable(async () => (await f()) * 3);
    const f = DataFlowVariable(() => {
      counter++;
      return new Promise((ok) => setTimeout(ok(3), 10));
    });
    e().then((val) => assert.equals(counter, 1));
    e().then((val) => assert.equals(val, 9));
    e().then((val) => assert.equals(counter, 1)); // yes, again!
  },
  true
);

tat(
  "Module Scheduler / test-cases-2",
  (assert) => {
    console.log("running [Scheduler]Test cases...");

    const result = [];

    const scheduler = Scheduler();
    scheduler.add((ok) => {
      setTimeout((_) => {
        // we wait before pushing
        result.push(1);
        ok();
      }, 100);
    });

    scheduler.add((ok) => {
      // we push "immediately"
      result.push(2);
      ok();
    });

    scheduler.addOk(() => result.push(3)); // convenience

    scheduler.add(() => {
      assert.equals(result[0], 1); // sequence is still ensured
      assert.equals(result[1], 2);
      assert.equals(result[2], 3);
    });
  },
  true
);
