import { Attribute, properties as AttProps } from "./../presentationModel.js";
import { tat } from "./../test.js";

tat(
  "Attribute",
  (assert) => {
    let attr = Attribute("init");

    assert.equals(attr.getObs(AttProps.VALUE).getValue(), "init");

    attr.setValidator(() => true);
    assert.equals(attr.getObs(AttProps.VALID).getValue(), true);

    attr.setConverter((text) => text.toUpperCase());
    assert.equals(attr.getObs(AttProps.VALUE).getValue(), "INIT");
    attr.setConvertedValue("hello");
    assert.equals(attr.getObs(AttProps.VALUE).getValue(), "HELLO");
    attr.getObs(AttProps.VALUE).setValue("world"); // direct access : do not convert
    assert.equals(attr.getObs(AttProps.VALUE).getValue(), "world");

    attr.setConvertedValue("123");
    let valid = undefined;
    assert.equals(attr.getObs(AttProps.VALID).getValue(), true);
    attr.getObs(AttProps.VALID).onChange((state) => (valid = state));
    assert.equals(valid, true);
    attr.setValidator((val) => val.length > 4);
    assert.equals(attr.getObs(AttProps.VALID).getValue(), false);
    assert.equals(valid, false);
    attr.setConvertedValue("12345");
    assert.equals(valid, true);
    attr.setConvertedValue("123");
    assert.equals(valid, false);

    attr = Attribute("initial");
    attr.setConverter((text) => text.toUpperCase());
    assert.equals(attr.getObs(AttProps.DIRTY).getValue(), true);
    attr.save();
    assert.equals(attr.getObs(AttProps.DIRTY).getValue(), false);
    attr.setConvertedValue("test1");
    attr.setConvertedValue("test2");
    assert.equals(attr.getObs(AttProps.VALUE).getValue(), "TEST2");
    assert.equals(attr.getObs(AttProps.DIRTY).getValue(), true);
    attr.reset();
    assert.equals(attr.getObs(AttProps.VALUE).getValue(), "INITIAL");
    assert.equals(attr.getObs(AttProps.DIRTY).getValue(), false);
    attr.setConvertedValue("test3");
    attr.save();
    assert.equals(attr.getObs(AttProps.DIRTY).getValue(), false);
    attr.reset();
    assert.equals(attr.getObs(AttProps.DIRTY).getValue(), false);
    assert.equals(attr.getObs(AttProps.VALUE).getValue(), "TEST3");
  },
  true
);
