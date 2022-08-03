tat(
  "Module Observable / test-cases-1",
  (assert) => {
    let found;
    const obs = Observable("");

    assert.equals(obs.getValue(), "");
    obs.onChange((val) => (found = val));
    assert.equals(found, "");
    obs.setValue("Hello World");
    assert.equals(found, "Hello World");

    let nbOdd;
    let nbItemsAdded = 0;
    let nbItemsDel = 0;
    const obsList = ObservableList([1, 2, 3]);
    nbOdd = obsList.countIf((val) => val % 2 == 0);
    obsList.onAdd(() => nbItemsAdded++);
    obsList.onDel(() => nbItemsDel++);
    assert.equals(obsList.count(), 3);
    assert.equals(nbOdd, 1);

    obsList.add(4);
    obsList.add(4);
    obsList.add(5);
    obsList.add(6);
    obsList.del(2);
    obsList.del(10);
    assert.equals(nbItemsAdded, 4);
    assert.equals(nbItemsDel, 2);
    assert.equals(obsList.count(), 6);
    assert.equals(
      obsList.countIf((val) => val % 2 == 0),
      3
    );
    assert.equals([1, 3, 4, 4, 5, 6].equals(obsList.getList()), true);
  },
  true
);
