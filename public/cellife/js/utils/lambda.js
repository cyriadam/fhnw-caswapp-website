/**
 * @module utils/lambda
 * Collection of lambda expressions
 */

// --- lamba exp ---
export const id = (x) => x;
const konst = (x) => (y) => x;
const T = konst;
const F = (x) => (y) => y;
const flip = (p) => (x) => (y) => p(y)(x);

// Pair
export const pair = (x) => (y) => (f) => f(x)(y);
export const fst = (p) => p(T);
export const snd = (p) => p(F);
const pairValues = (x) => (y) => ({ x, y });
export const pairEquals = (x) => (y) => fst(x) === fst(y) && snd(x) === snd(y);
const pairPlus = (a) => (b) => pair(fst(a) + fst(b))(snd(a) + snd(b));

// Tuple
export const Tuple = (n) => [
  (...arg) =>
    (f) =>
      f(Object.seal(arg)),
  ...Array.from({ length: n }, (val, idx) => (t) => t(id)[idx]),
];

// Either
export const Left = (x) => (l) => (r) => l(x);
export const Right = (x) => (l) => (r) => r(x);
export const either = (e) => (l) => (r) => e(l)(r);

// Loop
const eq = (y) => (x) => x == y;
const gt = (y) => (x) => x > y;
const ge = (y) => (x) => x >= y;
const not = flip;
export const lt = not(gt);
const le = not(ge);
const neq = not(eq);
export const inc = (x) => (y) => x + y;
const loop = (x) => (p) => x > 0 ? (p(), loop(x - 1)(p)) : null;
export const loopWhile = (x) => (c) => (n) => (p) => c(x) ? (p(x), loopWhile(n(x))(c)(n)(p)) : null;
const ifelse = (c) => (x) => (y) => c(x)(y) ? Right(fst(x)(y)) : Left(fst(x)(y));
const compare = (c) => (x) => (y) => c(x)(y) ? snd(x)(y) : fst(x)(y);
