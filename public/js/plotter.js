//!\ requiered lambda.js
//!\ requiered global.js

// --- local lambda exp ---
const width = fst;
const height = snd;

// --- elements ---
let $canvas;
let $input;
let inputHasfocus = false;
let debug = false;
let black = "rgb(0,0,0)";
let red = "rgb(255,0,0)";
let grayDark = "rgb(68,68,68)";
let grayLight = "rgb(184,184,184)";

// --- testCases ---
let testCases = [];

const runTests = () => {
  try {
    // -- add testcases
    testCases.push(() => {
      initSheet();
      plotterFunction("x*x");
      return sheet.functionValid;
    });
    testCases.push(() => {
      // -- diseable the alert --
      let alertBackup = alert;
      alert = () => {};
      initSheet();
      plotterFunction("x*x+c");
      // -- enable alert --
      alert = alertBackup;
      return !sheet.functionValid;
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
  cellSize: pair(20)(20),
  functionString: "Math.cos(x)",
  function: Function("x", `return Math.cos(x)`),
  functionValid: true,
};

// --- game functions ---
const init = () => {
  either(
    (() => {
      // -- perform the testcases
      popupDiseabled = true;
      $canvas = document.querySelector(".plotter-canvas");
      $input = document.querySelector(".plotter-function");
      return $canvas == null || $input == null || !runTests() ? Left("plotter engine errors detected") : Right();
    })()
  )((err) => {
    alert(err);
  })(() => {
    // -- render the function
    popupDiseabled = false;
    try {
      initSheet();
      run();
    } catch (err) {
      alert(err.message);
    }
  });
};

const initSheet = () => {
  sheet = { ...sheet, functionString: "Math.cos(x)", function: Function("x", `return Math.cos(x)`), functionValid: true };
  sheet.cellSize = pair($canvas.width / (sheet.axes.xMax - sheet.axes.xMin))($canvas.height / (sheet.axes.yMax - sheet.axes.yMin));
};

let run = () => {
  // register events
  window.addEventListener("keydown", ({ key }) => {
    if (!inputHasfocus && sheet.functionValid) {
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
    sheet.functionValid = true;
    sheet.functionString = f;
  } catch (e) {
    sheet.functionValid = false;
    if (debug) console.error(e.message);
  }
  renderSheet();
};

const zoomSheet = (factor) => {
  sheet.axes = {
    xMin: sheet.axes.xMin * factor,
    xMax: sheet.axes.xMax * factor,
    yMin: sheet.axes.yMin * factor,
    yMax: sheet.axes.yMax * factor,
  };
  sheet.cellSize = pair($canvas.width / (sheet.axes.xMax - sheet.axes.xMin))($canvas.height / (sheet.axes.yMax - sheet.axes.yMin));
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
    x: (0 - sheet.axes.xMin + x) * width(sheet.cellSize) + deltaX,
    y: (sheet.axes.yMax - y) * height(sheet.cellSize) - deltaY,
  };
};

const toNDecimal = (x, y = 2) => Math.round(x * Math.pow(10, y)) / Math.pow(10, y);

const renderSheet = () => {
  // -- check if the function is valid
  if (!sheet.functionValid) {
    if (!$input.classList.contains("error")) $input.classList.add("error");
    return popup("<h2>Error...</h2><p>The function is <em>not</em> valid!</p></h2>");
  } else if ($input.classList.contains("error")) $input.classList.remove("error");

  // -- render the function
  let context = $canvas.getContext("2d");
  if (debug) console.log(sheet.cellSize(pairValues));

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
    if (width(sheet.cellSize) > 10 && height(sheet.cellSize) > 10) context.fillText(i, ...Object.values(convertToCanvas(i, 0, 3, -10)));
    context.beginPath();
    context.moveTo(...Object.values(convertToCanvas(i, 0, 0, -2)));
    context.lineTo(...Object.values(convertToCanvas(i, 0, 0, 2)));
    context.stroke();
  });
  tantQue(sheet.axes.yMin)(lt(sheet.axes.yMax))(inc(1))((i) => {
    if (width(sheet.cellSize) > 10 && height(sheet.cellSize) > 10) context.fillText(i, ...Object.values(convertToCanvas(0, i, 3, -10)));
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
  tantQue(sheet.axes.xMin)(le(sheet.axes.xMax))(inc(5 / width(sheet.cellSize)))((i) => {
    context.lineTo(...Object.values(convertToCanvas(i, sheet.function(i))));
  });
  context.stroke();
  context.closePath();

  // draw the dots
  if (width(sheet.cellSize) > 20 && height(sheet.cellSize) > 20) {
    tantQue(sheet.axes.xMin)(le(sheet.axes.xMax))(inc(0.25))((i) => {
      context.beginPath();
      context.fillStyle = red;
      context.arc(convertToCanvas(i, sheet.function(i)).x, convertToCanvas(i, sheet.function(i)).y, 2, 0, Math.PI * 2, true);
      context.fill();
      context.closePath();
    });
  }
};
