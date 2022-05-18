import {Observable} from './observable.js';
import { id } from './lambda.js';

export { Attribute, properties }

const properties = {
  VALUE : 'value',
  VALID : 'valid',
  EDITABLE : 'editable',
  DIRTY : 'dirty',
  LABEL : 'label',
}

const Attribute = value => {

    const observables = {};

    const hasObs = name => observables.hasOwnProperty(name);

    /**
     * @param {String} name 
     * @param {*} initialValue 
     * @returns {ObservableType} 
     */
    const getObs = (name, initialValue = null) => {
       return hasObs(name)?observables[name]:observables[name]=Observable(initialValue);
    }

    getObs(properties.VALUE, value);
    
    // -- validator 
    const setValidator = validator => getObs(properties.VALUE).onChange(val => getObs(properties.VALID).setValue(validator(val)));
    
    // -- converter 
    let converter = id;
    const setConvertedValue = val => getObs(properties.VALUE).setValue(converter(val));
    const setConverter = convert => {
      converter=convert;
      setConvertedValue(getObs(properties.VALUE).getValue());
    }
    
    // -- dirty 
    let cleanValue = value;
    const save = () => {
      getObs(properties.DIRTY).setValue(false);
      cleanValue=getObs(properties.VALUE).getValue();
    };
    
    const reset = () => { 
      if (getObs(properties.DIRTY).getValue()) {
        getObs(properties.VALUE).setValue(cleanValue);
        getObs(properties.DIRTY).setValue(false);
      }
    }
    getObs(properties.VALUE).onChange(()=>getObs(properties.DIRTY).setValue(true));


    return {
      getObs, hasObs, setValidator, setConverter, setConvertedValue, save, reset
    }

} 