tat(
  "Module UTIL / test-cases-1",
  (assert) => {
    // console.log('running [util]Test cases...');

    // --- test function 'times'
    // (10).times(x => console.log(`Hello World [${x}]`));
    const r = (10).times((x) => x * x);
    assert.equals(r.length, 10);
    assert.equals(r[0], 0);
    assert.equals(r[2], 6, "unexpected error!");
    assert.equals(r[9], 82);

    // --- test function 'Array.equals'
    assert.equals(Array.from({ length: 5 }, (val, idx) => idx).equals(Array.from({ length: 5 }, (val, idx) => idx)), true);
    assert.equals(Array.from({ length: 5 }, (val, idx) => idx).equals(Array.from({ length: 4 }, (val, idx) => idx)), false);
    const arr = [0, 1, 2, "test"];
    assert.equals(arr.equals([0, 1, 3, "test"]), false);
    assert.equals(arr.equals([0, 1, 2, "test"]), true);
  },
  true
);
