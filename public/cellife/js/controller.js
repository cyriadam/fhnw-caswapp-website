/**
 * @module Controllers as shallow wrappers around observables
 * Generic selection controller
 */
import { Observable } from "./utils/observable.js";

export { SelectionController };

const SelectionController = (noSelection) => {
  const selectedModelObs = Observable(noSelection);

  return {
    setSelectedModel: selectedModelObs.setValue,
    getSelectedModel: selectedModelObs.getValue,
    onModelSelected: selectedModelObs.onChange,
    clearSelection: () => selectedModelObs.setValue(noSelection),
  };
};
