// == Prototypes ==
Number.prototype.times = function (callback) {
  return Array.from({ length: this }, (x, idx) => callback(idx));
};

Array.prototype.equals = function (arr) {
  if (arr == undefined || arr.length !== this.length) return false;
  return this.every((val, idx) => val === arr[idx]);
};

Number.prototype.pad = function (size) {
  var zero = size - this.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + this;
};

String.prototype.toFixed = function (size) {
  return size > this.length ? this + " ".repeat(size - this.length) : this.substring(0, size);
};

// == business functions ==
export const random = (max) => Math.floor(Math.random() * max);

export const toNDecimal = (x, y) => Math.round(x * Math.pow(10, y)) / Math.pow(10, y);

export const rmStyle = (styleId) => {
  const styleElt = document.querySelector(`style[id=${styleId}]`);
  if (styleElt) document.head.removeChild(styleElt);
};

export const addStyle = (styleId, styleCss) => {
  rmStyle(styleId);

  const style = document.createElement("STYLE");
  style.setAttribute("id", styleId);
  style.innerHTML = styleCss;
  document.head.appendChild(style);
};

export const dom = (innerString, rootElement = "DIV") => {
  const div = document.createElement(rootElement); // only for parsing
  div.innerHTML = innerString;
  return div.firstChild;
};

export const makeObj = (key, val) => Object.fromEntries(new Map([[key, val]]));

export const cleanHtml = (elt) => {
  elt.value = elt.value.replaceAll(/[${}[\];<+\\>]/g, "");
};

export const secureHtmlInputs = () => {
  // prevent all input fields from html injection
  [...document.querySelectorAll("input, textarea")].forEach((elt) => elt.addEventListener("input", (e) => cleanHtml(e.target)));
};

export function* sequence() {
  let i = 0;
  while (true) yield ++i;
}

let audio;
export const stopSound = () => {
  if (audio) audio.pause();
};

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

export const checkFieldLength = (elt, lg = 0, errMsg = 0 ? "must not be empty" : `must be at least ${lg} char length`) => {
  let r = true;
  if (elt.value.trim().length < lg) {
    elt.classList.add("error");
    const parentElt = elt.parentNode;
    if (Array.from(parentElt.classList).includes("wrapper-input")) parentElt.setAttribute("error-text", errMsg);
    r = false;
  }
  return r;
};

export const clearError = (elt) => {
  elt.classList.remove("error");
  const parentElt = elt.parentNode;
  if (Array.from(parentElt.classList).includes("wrapper-input")) parentElt.setAttribute("error-text", "");
};

export const onDialogSubmit = (dialogElt, subscriber) => {
  dialogElt.addEventListener("close", (e) => {
    if (dialogElt.returnValue == "submit") {
      dialogElt.returnValue = "";
      subscriber(dialogElt.querySelector("form"));
    }
  });
};

// click outside of the dialog cancel the form
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
