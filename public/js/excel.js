//!\ requiered lambda.js
let debug = false;

// -- elements --
let $dataContainer;
let $buttonCalculate;

// -- definition --
let ncols = 4;
let nrows = 6;

let formuleas = {};

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

const init = () => {
  either(
    (() => {
      $dataContainer = document.querySelector(".data-container");
      $buttonCalculate = document.querySelector(".button-calculate");
      return $dataContainer === null || $buttonCalculate === null || !runTests ? Left("excel engine errors detected") : Right();
    })()
  )((err) => {
    alert(err);
  })(() => {
    // -- render the formuleas
    try {
      initSheet();
      renderSheet();
    } catch (err) {
      alert(err.message);
    }
  });
};

const initSheet = () => {
  // intialise the formuleas
  tantQue(1)(le(nrows))(inc(1))((r) => {
    let totalCol = [];
    tantQue(1)(le(ncols))(inc(1))((c) => {
      let cellId = `${String.fromCharCode(64 + r)}${c}`;
      formuleas[cellId] = c === ncols ? totalCol.join("+") : c.toString();
      totalCol.push(`n(${cellId})`);
    });
  });

  // button.click
  $buttonCalculate.addEventListener("click", () => {
    renderSheetValues();
  });

  // cell-sheet.click
  $dataContainer.addEventListener("click", (e) => {
    let cell = e.target.closest("input");
    if (!cell) return;

    if (debug) console.log("-> render formuleas");
    Object.keys(formuleas).forEach((cellId) => (eval(`${cellId}`).value = formuleas[cellId]));
  });

  $dataContainer.addEventListener("change", (e) => {
    let cell = e.target.closest("input");
    if (!cell) return;

    if (debug) console.log(`cell[${cell.id}] updated with [${cell.value}]`);
    formuleas[cell.id] = cell.value;
    if (!cell.classList.contains("updated")) cell.classList.add("updated");
  });
};

const renderSheetValues = () => {
  if (debug) console.log("-> render formuleas calculated values");
  Object.keys(formuleas).forEach((cellId) => {
    try {
      eval(`${cellId}.value=${eval(eval(cellId).value)}`);
      if (eval(cellId).classList.contains("updated")) eval(cellId).classList.remove("updated");
    } catch (err) {
      console.log(`cell[${cellId}] formulea is not valid (${err.message})`);
    }
  });
};

const renderSheet = () => {
  if (debug) console.log("renderSheet");
  if (debug) console.log(formuleas);

  // rebuild the container
  $dataContainer.innerHTML = "";

  tantQue(1)(le(nrows))(inc(1))((r) => {
    let eltTR = document.createElement("TR");
    tantQue(1)(le(ncols))(inc(1))((c) => {
      let cellId = `${String.fromCharCode(64 + r)}${c}`;
      let eltTD = document.createElement("TD");
      eltTR.appendChild(eltTD);
      let eltINPUT = document.createElement("INPUT");
      eltINPUT.setAttribute("id", cellId);
      eltINPUT.setAttribute("value", formuleas[cellId]);
      eltTD.appendChild(eltINPUT);
    });
    $dataContainer.appendChild(eltTR);
  });
};

// const test = () => {
//   // console.log("iici-1", eval("A1")); // <input id="A1" value="1">
//   console.log("iici-1", eval("n(A1)"));
//   console.log("iici-2", eval("n(A1)+n(A2)*2+n(A3)+10"));
// };

const n = (domEltId) => {
  return parseInt(domEltId.value);
};
