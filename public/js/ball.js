// --- elements ---
let $canvas;
let debug = false;

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

// --- testCases ---
let testCases = [];

const runTests = () => {
  try {
    // -- add testcases
    let ball = createBall();
    ball.radius = game.cellWidth / 2;

    testCases.push(() => {
      // ball moving
      ball = { ...ball, coord: { x: 10, y: 10 }, delta: { x: 0, y: 0 } };
      let ballCordBefore = Pair(ball.coord.x)(ball.coord.y);
      // console.log(JSON.stringify(ball));
      nextBoard(ball);
      // console.log(JSON.stringify(ball));
      let ballCordAfter = Pair(ball.coord.x)(ball.coord.y);
      return !PairEquals(ballCordBefore)(ballCordAfter);
    });
    testCases.push(() => {
      // ball hurts bottom
      ball = { ...ball, coord: { x: 10, y: 0 }, delta: { x: 0, y: -1 } };
      let ballDeltaBefore = Pair(ball.delta.x)(ball.delta.y);
      // console.log(JSON.stringify(ball));
      nextBoard(ball);
      // console.log(JSON.stringify(ball));
      let ballDeltaAfter = Pair(ball.delta.x)(ball.delta.y);
      return ballDeltaBefore(snd) < 0 && ballDeltaAfter(snd) > 0;
    });
    testCases.push(() => {
      // ball hurts right boundary
      ball = { ...ball, coord: { x: game.boundaries.x, y: 0 }, delta: { x: 1, y: 0 } };
      let ballDeltaBefore = Pair(ball.delta.x)(ball.delta.y);
      // console.log(JSON.stringify(ball));
      nextBoard(ball);
      // console.log(JSON.stringify(ball));
      let ballDeltaAfter = Pair(ball.delta.x)(ball.delta.y);
      return ballDeltaBefore(fst) > 0 && ballDeltaAfter(fst) < 0;
    });
    testCases.push(() => {
      // ball hurts left boundary
      ball = { ...ball, coord: { x: 0, y: 0 }, delta: { x: -1, y: 0 } };
      let ballDeltaBefore = Pair(ball.delta.x)(ball.delta.y);
      // console.log(JSON.stringify(ball));
      nextBoard(ball);
      // console.log(JSON.stringify(ball));
      let ballDeltaAfter = Pair(ball.delta.x)(ball.delta.y);
      return ballDeltaBefore(fst) < 0 && ballDeltaAfter(fst) > 0;
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

let game = {
  boundaries: { x: 40, y: 20 },
  framerate: 1000 / 24,
  gravity: 9.81,
  frottements: 0.99,
  cellWidth: 20,
  cellHeight: 20,
};

let balls = [];
let background = new Image();
background.src = "/img/wood-texture.jpg"; // set the image to the canvas size

const createBall = (id) => {
  let ball = {
    coord: { x: 0, y: 0 },
    coordOld: { x: 0, y: 0 },
    delta: { x: 0, y: 0 },
    radius: 5, // pixels
    elasticity: 0,
    box: { top: 0, right: 0, bottom: 0, left: 0 },
    enable: true,
    color: "rgb(255,0,0)",
    id,
  };
  ball = {
    ...ball,
    coord: { x: 1 + random(game.boundaries.x - 2), y: game.boundaries.y - 1 },
    delta: { x: false ? 0 : random(10) / 10, y: false ? 0 : -random(5) / 10 },
    radius: 10 + random(3) * 10,
    elasticity: 0.99,
    color: `rgb(${random(255)},${random(255)},${random(255)})`,
  };
  ball = {
    ...ball,
    box: {
      top: -(ball.radius / game.cellHeight),
      right: ball.radius / game.cellWidth,
      bottom: ball.radius / game.cellHeight,
      left: -(ball.radius / game.cellWidth),
    },
  };
  return ball;
};

// --- game functions ---
const init = () => {
  try {
    // -- perform the testcases
    if (!runTests()) throw new Error("game engine errors detected");

    // -- start the game
    $canvas = document.querySelector(".ball-canvas");

    initGame($canvas);
    run($canvas);
  } catch (e) {
    alert(e.message);
  }
};

const initGame = (canvas) => {
  game.cellWidth = canvas.width / game.boundaries.x;
  game.cellHeight = canvas.height / game.boundaries.y;
  balls = [];
  for (let i = 0; i < 15; i++) balls.push(createBall(i));
  // console.log(JSON.stringify(game));

  // -- clear the screen
  let context = canvas.getContext("2d");
  // context.fillStyle = "white";
  // context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(background, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
};

let run = (canvas) => {
  let intervalGameId = setInterval(() => {
    nextBoardAllBalls();
    renderGame(canvas);
    if (balls.every((ball) => !ball.enable)) {
      clearInterval(intervalGameId);
      alert("The End");
    }
  }, game.framerate);
};

const convertToCanvas = ({ x, y }) => {
  return {
    x: x * game.cellWidth,
    y: (game.boundaries.y - y) * game.cellHeight,
  };
};

const toNDecimal = (x, y) => Math.round(x * Math.pow(10, y)) / Math.pow(10, y);
const random = (max) => Math.floor(Math.random() * max);

const nextBoard = (ball) => {
  if (ball.enable) {
    ball.coordOld = ball.coord;

    // apply the gravity
    ball.delta.y = toNDecimal(ball.delta.y - game.gravity / game.framerate, 5);
    ball.coord = { x: ball.coord.x + ball.delta.x, y: ball.coord.y + ball.delta.y };
    if (debug) console.log("nextBoard", JSON.stringify(ball));

    // manage game boundaries
    if (ball.coord.y <= ball.box.bottom) {
      ball.delta.y = toNDecimal(Math.abs(ball.delta.y * ball.elasticity), 5);
      // replace the ball in the boundaries
      ball.coord = { x: ball.coord.x + ball.delta.x, y: ball.box.bottom };
      ball.delta.x = ball.delta.x * game.frottements;
      if (false) console.log("nextBoard-Bottom", JSON.stringify(ball));
    }
    if (ball.coord.x + ball.box.right >= game.boundaries.x) {
      ball.delta.x = -ball.delta.x;
      // replace the ball in the boundaries
      ball.coord = { x: game.boundaries.x - ball.box.right, y: ball.coord.y };
      ball.delta.x = ball.delta.x * game.frottements;
      if (debug) console.log("nextBoard-Right", JSON.stringify(ball));
    }
    if (ball.coord.x + ball.box.left <= 0) {
      ball.delta.x = -ball.delta.x;
      // replace the ball in the boundaries
      ball.coord = { x: 0 - ball.box.left, y: ball.coord.y };
      ball.delta.x = ball.delta.x * game.frottements;
      if (debug) console.log("nextBoard-Left", JSON.stringify(ball));
    }

    // stop the ball
    if (ball.coord.y === ball.box.bottom && Math.abs(ball.delta.y) < 0.2 && Math.abs(ball.delta.x) < 0.1) {
      if (debug) console.log("nextBoard-Stop", JSON.stringify(ball));
      ball.enable = false;
    }
  }
};

const nextBoardAllBalls = () => {
  balls.forEach(nextBoard);
};

const renderGame = (canvas) => {
  let context = canvas.getContext("2d");
  balls.forEach((ball) => {
    let coord = convertToCanvas(ball.coordOld);
    // -- clear the previous ball
    let box = {
      x: coord.x - ball.radius - 2,
      y: coord.y - ball.radius - 2,
      w: 4 + ball.radius * 2,
    };
    // context.clearRect(box.x, box.y, box.w, box.w);
    context.drawImage(background, box.x, box.y, box.w, box.w, box.x, box.y, box.w, box.w);
  });

  balls.forEach((ball) => {
    // -- render ball
    let coord = convertToCanvas(ball.coord);
    context.beginPath();
    context.fillStyle = ball.color;
    context.arc(coord.x, coord.y, ball.radius, 0, Math.PI * 2, true);
    context.fill();
    context.closePath();
  });
};
