const path = require("path");

// -- definition of global settings --
global.__basedir = path.join(__dirname, "../..");

function * sequence() {
  let i=0;
  while(true) yield ++i; 
}

const random = (max) => Math.floor(Math.random() * max);

Number.prototype.pad = function(size) {
    var zero = size - this.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + this;
}

String.prototype.toFixed = function(size) {
    return size>this.length?(this + " ".repeat(size-this.length)):this.substring(0, size);
}

const makeObj = (key, val) =>  Object.fromEntries(new Map([[key, val]]));

module.exports = { sequence, random, makeObj } 