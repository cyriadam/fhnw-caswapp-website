/**
 * @module utils/general
 * Collection of utility functions
 */

// == Prototypes ==

/**
 * Execute a callback function several times
 * @param {Function} callback
 */
Number.prototype.times = function (callback) {
  return Array.from({ length: this }, (x, idx) => callback(idx));
};

/**
 * Compare 2 arrays
 * @param {Array} arr
 * @returns {boolean}
 */
Array.prototype.equals = function (arr) {
  if (arr == undefined || arr.length !== this.length) return false;
  return this.every((val, idx) => val === arr[idx]);
};

/**
 * Format a number with leading zero
 * @param {number} size
 * @returns {String}
 */
Number.prototype.pad = function (size) {
  var zero = size - this.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + this;
};

/**
 * Returns a string with a given length
 * @param {number} size
 * @returns {String}
 */
String.prototype.toFixed = function (size) {
  return size > this.length ? this + " ".repeat(size - this.length) : this.substring(0, size);
};

// == business functions ==

/**
 * Returns a random number between 0 and the given parameter
 * @param {number} max
 * @returns {number}
 */
export const random = (max) => Math.floor(Math.random() * max);

/**
 * Returns a number with the given decimals
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export const toNDecimal = (x, y) => Math.round(x * Math.pow(10, y)) / Math.pow(10, y);

/**
 * Remove a style node from the document head
 * @param {String} styleId
 */
export const rmStyle = (styleId) => {
  const styleElt = document.querySelector(`style[id=${styleId}]`);
  if (styleElt) document.head.removeChild(styleElt);
};

/**
 * Inject a style node in the document head
 * @param {String} styleId
 * @param {String} styleCss
 */
export const addStyle = (styleId, styleCss) => {
  rmStyle(styleId);

  const style = document.createElement("STYLE");
  style.setAttribute("id", styleId);
  style.innerHTML = styleCss;
  document.head.appendChild(style);
};

/**
 * Returns a dom structure from a template string
 * 
 * Note: the rootElement is by default DIV
 *
 * @param {String} innerString
 * @param {String} rootElement
 * @returns {ChildNode}
 *
 * @example
 * dom(`<tr><td></td></tr>`, "tbody");
 * dom(`<input id='' type='text' size="42" value=''>`);
 */
export const dom = (innerString, rootElement = "DIV") => {
  const div = document.createElement(rootElement); // only for parsing
  div.innerHTML = innerString;
  return div.firstChild;
};

/**
 * Create an object
 * @param {String} key
 * @param {*} val
 * @returns {Object} { key:value }
 *
 * @example
 * makeObj("field", value)
 */
export const makeObj = (key, val) => Object.fromEntries(new Map([[key, val]]));

/**
 * Remove characters from an input html element, which may be used for html code injection
 * @param {HTMLInputElement} elt
 */
export const cleanHtml = (elt) => {
  elt.value = elt.value.replaceAll(/[${}[\];<+\\>]/g, "");
};

/**
 * Prevent all input fields from html injection
 */
export const secureHtmlInputs = () => {
  [...document.querySelectorAll("input, textarea")].forEach((elt) => elt.addEventListener("input", (e) => cleanHtml(e.target)));
};

/**
 * Retruns a sequence
 */
export function* sequence() {
  let i = 0;
  while (true) yield ++i;
}

// == utilities for audio ==

let audio; // the current audio

/**
 * Pause the current audio
 */
export const stopSound = () => {
  if (audio) audio.pause();
};

/**
 * Initialise and play an audio
 * 
 * Note : the sounds are located in the /cellife/sounds/ folder
 *
 * @param {String} fileName - the sound
 * @param {number} [volume=1]
 * @param {String} [elemId] - reference of a HTMLInput element checked to play or not the sound
 */
export const playSound =
  (fileName, volume = 1, elemId) =>
  () => {
    const target = document.getElementById(elemId);
    if (!(target && target.checked)) return;

    audio = new Audio(`/cellife/sounds/${fileName}`);
    if (audio) {
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play();
    }
  };

// == input field utilities ==

/**
 * Check and add the 'error' class to a HTMLInputElement depending of his size
 * An error message is added if his parent is a 'wrapper-input'
 * @param {HTMLInputElement} elt
 * @param {number} [lg=0]
 * @param {String} [errMsg] - if not given a default error message is generated
 * @returns {boolean} - true if the field has the minimum length
 */
export const checkFieldLength = (elt, lg = 0, errMsg = lg == 0 ? "must not be empty" : `must be at least ${lg} char length`) => {
  let r = true;
  if (elt.value.trim().length < lg) {
    elt.classList.add("error");
    const parentElt = elt.parentNode;
    if (Array.from(parentElt.classList).includes("wrapper-input")) parentElt.setAttribute("error-text", errMsg);
    r = false;
  }
  return r;
};

/**
 * Remove the 'error' class and the error message set by the checkFieldLength method
 * @param {HTMLInputElement} elt
 */
export const clearError = (elt) => {
  elt.classList.remove("error");
  const parentElt = elt.parentNode;
  if (Array.from(parentElt.classList).includes("wrapper-input")) parentElt.setAttribute("error-text", "");
};

// == dialog utilities ==

/**
 * Bind a function to the submit of a dialog
 * @param {HTMLDialogElement} dialogElt
 * @param {Function} subscriber
 */
export const onDialogSubmit = (dialogElt, subscriber) => {
  dialogElt.addEventListener("close", (e) => {
    if (dialogElt.returnValue == "submit") {
      dialogElt.returnValue = "";
      subscriber(dialogElt.querySelector("form"));
    }
  });
};

/**
 * Click outside of the dialog cancel the form
 */
export const escapeDialogs = () => {
  [...document.querySelectorAll("dialog")].forEach((elt) => {
    elt.addEventListener("click", (e) => {
      const rect = elt.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom || e.clientX < rect.left || e.clientX > rect.right) elt.close();
    });
    // bind the close dialog buttons to the dialog close
    [...elt.querySelectorAll("button.dialog-close")].forEach((btnElt) => btnElt.addEventListener("click", (e) => elt.close()));
  });
};
