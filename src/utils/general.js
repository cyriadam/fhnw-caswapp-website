/**
 * @module utils/general
 * Collection of utility functions
 */

const path = require("path");

// -- definition of global settings --
global.__basedir = path.join(__dirname, "../..");

// == Prototypes ==

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
 * create a sequence
 */
function* sequence() {
  let i = 0;
  while (true) yield ++i;
}

/**
 * Returns a random number between 0 and the given parameter
 * @param {number} max
 * @returns {number}
 */
const random = (max) => Math.floor(Math.random() * max);

/**
 * Create an object
 * @param {String} key
 * @param {*} val
 * @returns {Object} { key:value }
 *
 * @example
 * makeObj("field", value)
 */
const makeObj = (key, val) => Object.fromEntries(new Map([[key, val]]));

module.exports = { sequence, random, makeObj };
