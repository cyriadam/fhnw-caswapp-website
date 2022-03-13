//!\ requiered lambda.js

let debug = false;

// --- local lambda exp ---
const x = fst;
const y = snd;

// --- elements ---
let $canvasGame;

// --- testCases ---
let testCases = [];

const runTests = () => {
  try {
    // -- add testcases
    testCases.push(() => {
      // testcase 1 : check compare blocks
      let b1 = pair(5)(6);
      let b2 = pair(5)(6);
      return pairEquals(b1)(b2);
    });
    testCases.push(() => {
      // testcase 2 : check compare blocks
      let b1 = pair(5)(6);
      let b2 = pair(5)(7);
      return !pairEquals(b1)(b2);
    });
    testCases.push(() => {
      // testcase 3 : move snake d_up
      food = pair(5)(5);
      snake = snakeElt(d_up)([pair(0)(10), pair(0)(11), pair(0)(12)]);
      nextBoard();
      return pairEquals(snake.body[0])(pair(0)(9));
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

// --- game definition ---
const d_up = 1;
const d_right = 2;
const d_down = 3;
const d_left = 4;
let directionsClockwise = [d_up, d_right, d_down, d_left, d_up];
let directionsAntiClockwise = [d_up, d_left, d_down, d_right, d_up];

// --- game elements ---
let snakeElt = (direction) => (body) => ({ direction, body });

let game = {
  score: 0,
  gameOver: false,
  boundaries: { x: 20, y: 20 },
  cellWidth: 0,
  cellHeight: 0,
  speedInterval: 10000, // increase speed evey x msec
  speed: 1000, // game rendering speed
  speedMin: 100, // min speed
  speedFactor: 0.8,
  bombsInterval: 5000, // increase nb bombs evey x msec
  bombsMax: Math.floor((3 * (20 * 20)) / 100), // 3% of bombs
};

let food = {};
let snake = {};
let bombs = [];

// --- game functions ---
const resetGame = (canvas) => {
  game = { ...game, score: 0, gameOver: false, cellWidth: canvas.width / game.boundaries.x, cellHeight: canvas.height / game.boundaries.y };
  snake = snakeElt(d_up)([pair(10)(10), pair(10)(11), pair(10)(12), pair(10)(13)]);
  food = pair(Math.floor(Math.random() * game.boundaries.x))(Math.floor(Math.random() * game.boundaries.x));
  bombs = [];
};

const init = () => {
  either(
    (() => {
      // -- perform the testcases
      $canvasGame = document.querySelector(".game-canvas");
      return $canvasGame == null || !runTests() ? Left("game engine errors detected") : Right($canvasGame);
    })()
  )((err) => {
    // -- error testcases or dom missing eelements
    alert(err);
  })((canvas) => {
    try {
      // -- initialise the game
      resetGame(canvas);

      // register keydown events
      window.addEventListener("keydown", (e) => {
        // console.log(`e.key=${e.key}`);
        if (e.key === "ArrowRight") turnClockwise(true);
        else if (e.key === "ArrowLeft") turnClockwise(false);
      });

      // start the game
      if (!debug) document.getElementById("soundGameOn").play();
      heartBeat(canvas);
    } catch (err) {
      alert(err.message);
    }
  });
};

let heartBeat = (canvas) => {
  let timeReference = Date.now();

  // Bombs heartBeat
  let intervalBombsId = setInterval(() => {
    if (bombs.length < game.bombsMax) {
      if (debug) console.log(`add a new bomb over ${game.bombsMax - bombs.length} bombs`);
      let newBomb;
      do {
        newBomb = pair(Math.floor(Math.random() * game.boundaries.x))(Math.floor(Math.random() * game.boundaries.x));
      } while ([food, ...snake.body].some((elt) => pairEquals(elt)(newBomb)));
      bombs.push(newBomb);
    }
  }, game.bombsInterval);

  // Game heartBeat
  let intervalGameId = setInterval(() => {
    nextBoard();
    renderGame(canvas);
    if (Date.now() - timeReference >= game.speedInterval) {
      timeReference = Date.now();
      clearInterval(intervalGameId);
      clearInterval(intervalBombsId);
      // compute the new speed
      game.speed = game.speed > game.speedMin ? game.speed * game.speedFactor : game.speedMin;
      heartBeat(canvas);
    }
    if (game.gameOver) {
      clearInterval(intervalGameId);
      clearInterval(intervalBombsId);
      if (!debug) document.getElementById("soundGameEnd").play();
      alert(`Game Over, your score is ${game.score}`);
    }
  }, game.speed);
};

const turnClockwise = (clockwise) => {
  if (clockwise) snake.direction = directionsClockwise[directionsClockwise.findIndex((elt) => elt == snake.direction) + 1];
  else snake.direction = directionsAntiClockwise[directionsAntiClockwise.findIndex((elt) => elt == snake.direction) + 1];
};

const nextBoard = () => {
  //
  let head = snake.body[0](pairValues);

  // move the snake head
  if (snake.direction == d_up) head.y--;
  else if (snake.direction == d_right) head.x++;
  else if (snake.direction == d_down) head.y++;
  else head.x--;

  // manage game boundaries
  if (head.x < 0) head.x = game.boundaries.x - 1;
  else if (head.x >= game.boundaries.x) head.x = 0;
  if (head.y < 0) head.y = game.boundaries.y - 1;
  else if (head.y >= game.boundaries.y) head.y = 0;

  head = pair(head.x)(head.y);

  // collision with food detection
  if (pairEquals(food)(head)) {
    if (!debug) document.getElementById("soundBlip1").play();
    if (debug) console.log("> collision with food");
    game.score++;
    snake.body = [head, ...snake.body];
    // don't put the food on snake body or bombs
    do {
      food = pair(Math.floor(Math.random() * game.boundaries.x))(Math.floor(Math.random() * game.boundaries.x));
    } while ([...bombs, ...snake.body].some((elt) => pairEquals(elt)(food)));
  } else {
    snake.body = [head, ...snake.body.slice(0, -1)];
  }

  // collision with snake body detection
  if (snake.body.slice(1).some((elt) => pairEquals(elt)(head))) {
    if (debug) console.log("> collision with snake body");
    game.gameOver = true;
  }

  // collision with bombs detection
  if (bombs.some((elt) => pairEquals(elt)(head))) {
    if (debug) console.log("> collision with bombs");
    game.gameOver = true;
  }
};

const renderGame = (canvas) => {
  // -- clear the screen
  let context = canvas.getContext("2d");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  // console.log(game.speed, JSON.stringify(snake));

  // -- render food
  context.fillStyle = "red";
  context.beginPath();
  context.arc(x(food) * game.cellWidth + game.cellWidth / 2, y(food) * game.cellHeight + game.cellHeight / 2, game.cellHeight / 2, 0, Math.PI * 2, true);
  context.fill();

  // -- render snake head
  context.fillStyle = "green";
  context.fillRect(1 + x(snake.body[0]) * game.cellWidth, 1 + y(snake.body[0]) * game.cellHeight, game.cellWidth - 2, game.cellHeight - 2);

  // -- render snake body
  context.fillStyle = "cyan";
  snake.body.slice(1).forEach((elt) => context.fillRect(1 + x(elt) * game.cellWidth, 1 + y(elt) * game.cellHeight, game.cellWidth - 2, game.cellHeight - 2));

  // -- render the bombs
  bombs.forEach((elt) => {
    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "red";
    context.beginPath();
    context.moveTo(1 + x(elt) * game.cellWidth, 1 + y(elt) * game.cellHeight);
    context.lineTo((x(elt) + 1) * game.cellWidth - 1, (y(elt) + 1) * game.cellHeight - 1);
    context.moveTo(1 + x(elt) * game.cellWidth, (y(elt) + 1) * game.cellHeight - 1);
    context.lineTo((x(elt) + 1) * game.cellWidth - 1, 1 + y(elt) * game.cellHeight);
    context.stroke();
  });
};
