Number.prototype.times = function (callback) {
  // console.log(`prototype.times.this=[${this}]`);       // 'this' contains the value
  return Array.from({ length: this }, (x, idx) => callback(idx));
};

Array.prototype.equals = function (arr) {
  if (arr == undefined || arr.length !== this.length) return false;
  return this.every((val, idx) => val === arr[idx]);
};
