// --- elements ---
let $canvas;
let $input;
let inputHasfocus = false;
let debug = false;
let black = "rgb(0,0,0)";
let red = "rgb(255,0,0)";
let grayDark = "rgb(68,68,68)";
let grayLight = "rgb(184,184,184)";

// --- lamba exp ---
let id = (x) => x;
let Pair = (x) => (y) => (f) => f(x)(y);
let fst = (x) => (y) => x;
let snd = (x) => (y) => y;
let PairEquals = (x) => (y) => x(fst) === y(fst) && x(snd) === y(snd);
let left = (x) => (l) => (r) => l(x);
let right = (x) => (l) => (r) => r(x);
let either = (e) => (l) => (r) => e(l)(r);
let eq = (y) => (x) => x == y;
let gt = (y) => (x) => x > y;
let ge = (y) => (x) => x >= y;
let flip = (p) => (x) => (y) => p(y)(x);
let not = flip;
let lt = not(gt);
let le = not(ge);
let neq = not(eq);
let inc = (x) => (y) => x + y;
const boucle = (x) => (p) => x > 0 ? (p(), boucle(x - 1)(p)) : null;
const tantQue = (x) => (c) => (n) => (p) => c(x) ? (p(x), tantQue(n(x))(c)(n)(p)) : null;
const ifelse = (c) => (x) => (y) => c(x)(y) ? right(fst(x)(y)) : left(fst(x)(y));
const compare = (c) => (x) => (y) => c(x)(y) ? snd(x)(y) : fst(x)(y);
/*
const safeDiv = x => y => y===0? left("can not divide by 0"):right({x, y, r:x/y});
either(safeDiv(3)(2))(x=>console.error(x))(({x, y, r})=>console.log(`${x}/${y}=${r}`));
boucle(3)( _ => { console.log(`boucle()`)});
tantQue(0)(not(gt)(3))(inc(1))(x => { console.log(`tantQue(${x})`)});
ifelse(gt)(2)(3)((x) => console.log(`case1 : ${x}`))((x) => console.log(`case2 : ${x}`));
console.log(`max = ${compare(gt)(2)(3)}`);
console.log(`min = ${compare(lt)(3)(5)}`);
 */

// --- testCases ---
let testCases = [];

const runTests = () => {
  try {
    // -- add testcases
    testCases.push(() => {
      return true;
    });

    // -- run testcases
    let testCasesResults = testCases.map((elt) => elt());
    testCasesResults.forEach((elt, i) => {
      console.log(`testcase[${i}] ${elt ? "succeed" : "fails"}`);
    });
    return testCasesResults.every((elt) => elt);
  } catch (e) {
    console.error(e);
    return false;
  }
};

// --- definition ---

let sheet = {
  axes: { xMin: -10, xMax: 10, yMin: -5, yMax: 5 },
  cellSize: { width: 20, height: 20 },
  functionString: "Math.cos(x)",
  function: Function("x", `return Math.cos(x)`),
};

// --- game functions ---
const init = () => {
  try {
    // -- perform the testcases
    if (!runTests()) throw new Error("game engine errors detected");

    // -- start the game
    $canvas = document.querySelector(".plotter-canvas");
    $input = document.querySelector(".plotter-function");

    initSheet();
    run();
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
};

const initSheet = () => {
  sheet.cellSize.width = $canvas.width / (sheet.axes.xMax - sheet.axes.xMin);
  sheet.cellSize.height = $canvas.height / (sheet.axes.yMax - sheet.axes.yMin);
};

let run = () => {
  // register events
  window.addEventListener("keydown", ({ key }) => {
    if (!inputHasfocus) {
      if (key === "PageUp") return zoomSheet(1 / 2);
      if (key === "PageDown") return zoomSheet(2);
      if (key === "ArrowLeft") return moveSheet(-1, 0);
      if (key === "ArrowRight") return moveSheet(1, 0);
      if (key === "ArrowUp") return moveSheet(0, -1);
      if (key === "ArrowDown") return moveSheet(0, 1);
    }
    if (debug) console.log(`e.key=[${key}]`);
  });
  $input.addEventListener("keyup", ({ key }) => {
    if (inputHasfocus && key === "Enter") plotterFunction($input.value);
  });
  $input.addEventListener("blur", () => {
    inputHasfocus = false;
  });
  $input.addEventListener("focus", () => {
    inputHasfocus = true;
  });
  renderSheet();
};

const plotterFunction = (f) => {
  try {
    sheet.function = Function("x", `return ${f}`);
    let r = sheet.function(0); // validation function
    if (debug) console.log(`${f}(0)=${toNDecimal(r)}`);
    $input.classList.remove("error");
    sheet.functionString = f;
    renderSheet();
  } catch (e) {
    $input.classList.add("error");
    if (debug) console.error(e.message);
    alert(e);
  }
};

const zoomSheet = (factor) => {
  (sheet.axes = {
    xMin: sheet.axes.xMin * factor,
    xMax: sheet.axes.xMax * factor,
    yMin: sheet.axes.yMin * factor,
    yMax: sheet.axes.yMax * factor,
  }),
    (sheet.cellSize.width = $canvas.width / (sheet.axes.xMax - sheet.axes.xMin));
  sheet.cellSize.height = $canvas.height / (sheet.axes.yMax - sheet.axes.yMin);
  renderSheet();
};

const moveSheet = (x, y) => {
  sheet.axes = {
    xMin: sheet.axes.xMin + x,
    xMax: sheet.axes.xMax + x,
    yMin: sheet.axes.yMin - y,
    yMax: sheet.axes.yMax - y,
  };
  renderSheet();
};

const convertToCanvas = (x, y, deltaX = 0, deltaY = 0) => {
  return {
    x: (0 - sheet.axes.xMin + x) * sheet.cellSize.width + deltaX,
    y: (sheet.axes.yMax - y) * sheet.cellSize.height - deltaY,
  };
};

const toNDecimal = (x, y = 2) => Math.round(x * Math.pow(10, y)) / Math.pow(10, y);

const renderSheet = () => {
  let context = $canvas.getContext("2d");
  if (debug) console.log(sheet.cellSize);

  // -- clear the screen
  context.fillStyle = "white";
  context.fillRect(0, 0, $canvas.width, $canvas.height);

  // draw the axes
  context.lineWidth = 2;
  context.strokeStyle = grayDark;
  context.beginPath();
  context.moveTo(...Object.values(convertToCanvas(sheet.axes.xMin, 0)));
  context.lineTo(...Object.values(convertToCanvas(sheet.axes.xMax, 0)));
  context.moveTo(...Object.values(convertToCanvas(0, sheet.axes.yMin)));
  context.lineTo(...Object.values(convertToCanvas(0, sheet.axes.yMax)));
  context.stroke();

  // draw the scales
  context.fillStyle = black;
  context.font = "10px sans-serif";
  tantQue(sheet.axes.xMin)(lt(sheet.axes.xMax))(inc(1))((i) => {
    if (sheet.cellSize.width > 10 && sheet.cellSize.height > 10) context.fillText(i, ...Object.values(convertToCanvas(i, 0, 3, -10)));
    context.beginPath();
    context.moveTo(...Object.values(convertToCanvas(i, 0, 0, -2)));
    context.lineTo(...Object.values(convertToCanvas(i, 0, 0, 2)));
    context.stroke();
  });
  tantQue(sheet.axes.yMin)(lt(sheet.axes.yMax))(inc(1))((i) => {
    if (sheet.cellSize.width > 10 && sheet.cellSize.height > 10) context.fillText(i, ...Object.values(convertToCanvas(0, i, 3, -10)));
    context.beginPath();
    context.moveTo(...Object.values(convertToCanvas(0, i, -2, 0)));
    context.lineTo(...Object.values(convertToCanvas(0, i, 2, 0)));
    context.stroke();
  });

  // draw the lines
  context.lineWidth = 1;
  context.strokeStyle = grayLight;
  context.beginPath();
  context.moveTo(...Object.values(convertToCanvas(sheet.axes.xMin, sheet.function(sheet.axes.xMin))));
  tantQue(sheet.axes.xMin)(le(sheet.axes.xMax))(inc(5 / sheet.cellSize.width))((i) => {
    context.lineTo(...Object.values(convertToCanvas(i, sheet.function(i))));
  });
  context.stroke();
  context.closePath();

  // draw the dots
  if (sheet.cellSize.width > 20 && sheet.cellSize.height > 20) {
    tantQue(sheet.axes.xMin)(le(sheet.axes.xMax))(inc(0.25))((i) => {
      context.beginPath();
      context.fillStyle = red;
      context.arc(convertToCanvas(i, sheet.function(i)).x, convertToCanvas(i, sheet.function(i)).y, 2, 0, Math.PI * 2, true);
      context.fill();
      context.closePath();
    });
  }
};
