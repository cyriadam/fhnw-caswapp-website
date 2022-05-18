import { Attribute } from "./../presentationModel_v1.js";
import { tat } from "./../test.js";

tat('Module Attribute v1 / test-cases-1', (assert) => {
  let attr = Attribute("init");

  assert.equals(attr.getText(), "init");
  assert.equals(attr.getTextValid(), true);

  attr.setConverter(text=>text.toUpperCase());
  assert.equals(attr.getText(), "INIT");
  attr.setConvertedText("hello");
  assert.equals(attr.getText(), "HELLO");
  attr.setText("world");                      // direct access : do not convert
  assert.equals(attr.getText(), "world");

  attr.setText("test");                      
  let valid = undefined;
  assert.equals(attr.getTextValid(), true);
  attr.onTextValidChange(state => valid=state);
  assert.equals(valid, true);
  attr.setValidator(val=>val.length>4);
  assert.equals(attr.getTextValid(), false);
  assert.equals(valid, false);
  attr.setText("test123");                     
  assert.equals(valid, true);
  attr.setConvertedText("123");                      
  assert.equals(valid, false);

  attr = Attribute('initial');
  attr.setConverter(text=>text.toUpperCase());
  assert.equals(attr.isDirty(), true);
  attr.save();
  assert.equals(attr.isDirty(), false);
  // --
  attr.setConvertedText('test1');
  attr.setConvertedText('test2');
  assert.equals(attr.isDirty(), true);
  assert.equals(attr.getText(), 'TEST2');
  attr.reset();
  assert.equals(attr.getText(), 'INITIAL');
  assert.equals(attr.isDirty(), false);
  attr.setConvertedText('test3');
  attr.save();
  assert.equals(attr.isDirty(), false);
  attr.reset();
  assert.equals(attr.isDirty(), false);
  assert.equals(attr.getText(), 'TEST3');
  
}, true);