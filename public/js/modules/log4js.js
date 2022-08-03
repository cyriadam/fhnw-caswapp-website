export const LEVEL_NONE = -1;
export const LEVEL_ERROR = 0;
export const LEVEL_WARN = 1;
export const LEVEL_INFO = 2;
export const LEVEL_LOG = 3;
export const LEVEL_DEBUG = 4;

let logLevel = LEVEL_LOG;

export const setLogLevel = (level = LEVEL_INFO) => (logLevel = level);
export const getLogLevel = () => logLevel;
export const error = (...args) => {
  if (logLevel >= LEVEL_ERROR) Array.from(args, (arg) => console.error(arg));
};
export const warn = (...args) => {
  if (logLevel >= LEVEL_WARN) Array.from(args, (arg) => console.warn(arg));
};
export const info = (...args) => {
  if (logLevel >= LEVEL_INFO) Array.from(args, (arg) => console.info(arg));
};
export const log = (...args) => {
  if (logLevel >= LEVEL_LOG) Array.from(args, (arg) => console.log(arg));
};
export const debug = (...args) => {
  if (logLevel >= LEVEL_DEBUG) Array.from(args, (arg) => console.log(arg));
};
