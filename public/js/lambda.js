// --- lamba exp ---
const id = (x) => x;
const konst = (x) => (y) => x;
const T = konst;
const F = (x) => (y) => y;
const flip = (p) => (x) => (y) => p(y)(x);

// Pair
const pair = (x) => (y) => (f) => f(x)(y);
const fst = (p) => p(T);
const snd = (p) => p(F);
const pairValues = (x) => (y) => ({ x, y });
const pairEquals = (x) => (y) => fst(x) === fst(y) && snd(x) === snd(y);
const pairPlus = (a) => (b) => pair(fst(a) + fst(b))(snd(a) + snd(b));

// Tuple
const Tuple = n => [
  (...arg) => f => f(Object.seal(arg)),
  ...Array.from({length:n}, (val, idx) => t => t(id)[idx])
];

// Either
const Left = (x) => (l) => (r) => l(x);
const Right = (x) => (l) => (r) => r(x);
const either = (e) => (l) => (r) => e(l)(r);

// Loop
const eq = (y) => (x) => x == y;
const gt = (y) => (x) => x > y;
const ge = (y) => (x) => x >= y;
const not = flip;
const lt = not(gt);
const le = not(ge);
const neq = not(eq);
const inc = (x) => (y) => x + y;
const boucle = (x) => (p) => x > 0 ? (p(), boucle(x - 1)(p)) : null;
const tantQue = (x) => (c) => (n) => (p) => c(x) ? (p(x), tantQue(n(x))(c)(n)(p)) : null;
const ifelse = (c) => (x) => (y) => c(x)(y) ? Right(fst(x)(y)) : Left(fst(x)(y));
const compare = (c) => (x) => (y) => c(x)(y) ? snd(x)(y) : fst(x)(y);



/*
// Tests
lst fst = x => y => x;

let b01 = pair(5)(6);
console.log(b01(fst)); // 5
console.log(fst(b01)); // y => x : NOK

let T = (x) => (y) => x;
let F = (x) => (y) => y;
let fst2 = (p) => p(T);
console.log(fst2(b01)); // 5 : OK

const safeDiv = x => y => y===0? left("can not divide by 0"):right({x, y, r:x/y});
either(safeDiv(3)(2))(x=>console.error(x))(({x, y, r})=>console.log(`${x}/${y}=${r}`));

boucle(3)( _ => { console.log(`boucle()`)});
tantQue(0)(not(gt)(3))(inc(1))(x => { console.log(`tantQue(${x})`)});
ifelse(gt)(2)(3)((x) => console.log(`case1 : ${x}`))((x) => console.log(`case2 : ${x}`));
console.log(`max = ${compare(gt)(2)(3)}`);
console.log(`min = ${compare(lt)(3)(5)}`);
 */
