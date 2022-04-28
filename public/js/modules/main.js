import {sayHi} from './say.js';

// export { init }

const init = (placeHolder) => {
  document.querySelector(placeHolder).innerHTML = sayHi('John');
}

//!\ add init() to global scope explicit to be used on onload
window.init = init;