/**
 * @module utils/CustomError
 * Extends Error ( add name, errorCode and data properties )
 */

module.exports = class CustomError extends Error {
  constructor(errorCode = "ERR", ...params) {
    super(...params);
    if (Error.captureStackTrace) Error.captureStackTrace(this, CustomError);

    this.name = "CustomError";
    this.errorCode = errorCode;
    this.date = new Date();
  }
};
