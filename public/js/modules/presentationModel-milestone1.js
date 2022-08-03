import { Observable } from "./observable.js";
import { id } from "./lambda.js";

export { Attribute };

const Attribute = (value) => {
  const valueObs = Observable(value);
  const validObs = Observable(true);
  const editableObs = Observable(true);
  const validatorObs = Observable((x) => true);
  const converterObs = Observable(id);
  const dirtyObs = Observable(false);

  let cleanValue = value;
  const save = () => {
    dirtyObs.setValue(false);
    cleanValue = valueObs.getValue();
  };

  const reset = () => {
    if (dirtyObs.getValue()) {
      valueObs.setValue(cleanValue);
      save();
    }
  };

  valueObs.onChange((text) => {
    validObs.setValue(validatorObs.getValue()(text));
    dirtyObs.setValue(true);
  });
  validatorObs.onChange((validator) => validObs.setValue(validator(valueObs.getValue())));
  converterObs.onChange((converter) => valueObs.setValue(converter(valueObs.getValue())));

  return {
    setText: (val) => valueObs.setValue(val),
    setConvertedText: (val) => valueObs.setValue(converterObs.getValue()(val)),
    getText: () => valueObs.getValue(),
    onTextChange: (subscriber) => valueObs.onChange(subscriber),
    isDirty: () => dirtyObs.getValue(),
    onDirtyChange: (subscriber) => dirtyObs.onChange(subscriber),

    setValidator: (validator) => validatorObs.setValue(validator),
    getTextValid: () => validObs.getValue(),
    onTextValidChange: (subscriber) => validObs.onChange(subscriber),

    setTextEditable: (editable) => editableObs.setValue(editable),
    getTextEditable: () => editableObs.getValue(),
    onTextEditableChange: (subscriber) => editableObs.onChange(subscriber),

    setConverter: (converter) => converterObs.setValue(converter),
    save,
    reset,
  };
};
