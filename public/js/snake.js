// --- elements ---
let $canvasGame;

// --- testCases ---
let testCases = [];

const runTests = () => {
  try {
    // -- add testcases
    testCases.push(() => {
      // testcase 1 : check compare blocks
      let b1 = blockElt(5)(6);
      let b2 = blockElt(5)(6);
      return blockEltEquals(b1)(b2);
    });
    testCases.push(() => {
      // testcase 2 : check compare blocks
      let b1 = blockElt(5)(6);
      let b2 = blockElt(5)(7);
      return !blockEltEquals(b1)(b2);
    });
    testCases.push(() => {
      // testcase 3 : move snake up
      food = blockElt(5)(5);
      snake = snakeElt(up)([blockElt(0)(10), blockElt(0)(11), blockElt(0)(12)]);
      nextBoard();
      return blockEltEquals(snake.body[0])(blockElt(0)(9));
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
const up = 1;
const right = 2;
const down = 3;
const left = 4;
let directionsClockwise = [up, right, down, left, up];
let directionsAntiClockwise = [up, left, down, right, up];

// --- game elements ---
let blockElt = (x) => (y) => ({ x, y });
let blockEltEquals = (b1) => (b2) => b1.x === b2.x && b1.y === b2.y;
let snakeElt = (direction) => (body) => ({ direction, body });

let game = {
  score: 0,
  gameOver: false,
  boundaries: { x: 20, y: 20 },
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
const resetGame = () => {
  game = { ...game, score: 0, gameOver: false };
  snake = snakeElt(up)([blockElt(10)(10), blockElt(10)(11), blockElt(10)(12), blockElt(10)(13)]);
  food = blockElt(Math.floor(Math.random() * game.boundaries.x))(Math.floor(Math.random() * game.boundaries.x));
  bombs = [];
};

const initGame = () => {
  try {
    // -- perform the testcases
    if (!runTests()) throw new Error("game engine errors detected");

    // -- initialise the game
    resetGame();
    $canvasGame = document.querySelector(".game-canvas");

    // register keydown events
    window.addEventListener("keydown", (e) => {
      // console.log(`e.key=${e.key}`);
      if (e.key === "ArrowRight") turnClockwise(true);
      else if (e.key === "ArrowLeft") turnClockwise(false);
    });

    // start the game
    document.getElementById("soundGameOn").play();
    heartBeat();
  } catch (e) {
    alert(e.message);
  }
};

let heartBeat = () => {
  let timeReference = Date.now();

  // Bombs heartBeat
  let intervalBombsId = setInterval(() => {
    if (bombs.length < game.bombsMax) {
      console.log(`add a new bomb over ${game.bombsMax - bombs.length} bombs`);
      let newBomb;
      do {
        newBomb = blockElt(Math.floor(Math.random() * game.boundaries.x))(Math.floor(Math.random() * game.boundaries.x));
      } while ([food, ...snake.body].some((elt) => blockEltEquals(elt)(newBomb)));
      bombs.push(newBomb);
    }
  }, game.bombsInterval);

  // Game heartBeat
  let intervalGameId = setInterval(() => {
    nextBoard();
    renderGame($canvasGame);
    if (Date.now() - timeReference >= game.speedInterval) {
      timeReference = Date.now();
      clearInterval(intervalGameId);
      clearInterval(intervalBombsId);
      // compute the new speed
      game.speed = game.speed > game.speedMin ? game.speed * game.speedFactor : game.speedMin;
      heartBeat();
    }
    if (game.gameOver) {
      clearInterval(intervalGameId);
      clearInterval(intervalBombsId);
      document.getElementById("soundGameEnd").play();
      alert(`Game Over, your score is ${game.score}`);
    }
  }, game.speed);
};

const turnClockwise = (clockwise) => {
  if (clockwise) snake.direction = directionsClockwise[directionsClockwise.findIndex((elt) => elt == snake.direction) + 1];
  else snake.direction = directionsAntiClockwise[directionsAntiClockwise.findIndex((elt) => elt == snake.direction) + 1];
};

const nextBoard = () => {
  // -- move the snake head
  let head = { ...snake.body[0] }; //!\ copy the head
  // move the snake head
  if (snake.direction == up) head.y--;
  else if (snake.direction == right) head.x++;
  else if (snake.direction == down) head.y++;
  else head.x--;

  // manage game boundaries
  if (head.x < 0) head.x = game.boundaries.x - 1;
  else if (head.x >= game.boundaries.x) head.x = 0;
  if (head.y < 0) head.y = game.boundaries.y - 1;
  else if (head.y >= game.boundaries.y) head.y = 0;

  // collision with food detection
  if (blockEltEquals(food)(head)) {
    document.getElementById("soundBlip1").play();
    console.log("> collision with food");
    game.score++;
    snake.body = [head, ...snake.body];
    // don't put the food on snake body or bombs
    do {
      food = blockElt(Math.floor(Math.random() * game.boundaries.x))(Math.floor(Math.random() * game.boundaries.x));
    } while ([...bombs, ...snake.body].some((elt) => blockEltEquals(elt)(food)));
  } else {
    snake.body = [head, ...snake.body.slice(0, -1)];
  }

  // collision with snake body detection
  if (snake.body.slice(1).some((elt) => blockEltEquals(elt)(head))) {
    console.log("> collision with snake body");
    game.gameOver = true;
  }

  // collision with bombs detection
  if (bombs.some((elt) => blockEltEquals(elt)(head))) {
    console.log("> collision with bombs");
    game.gameOver = true;
  }
};

const renderGame = (canvas) => {
  // -- clear the screen
  let context = canvas.getContext("2d");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  // console.log(game.speed, JSON.stringify(snake));

  // -- render game elements
  let cellWidth = canvas.width / game.boundaries.x;
  let cellHeight = canvas.height / game.boundaries.y;
  // -- render food
  context.fillStyle = "red";
  // context.fillRect(1+food.x*cellWidth, 1+food.y*cellHeight, cellWidth-2, cellHeight-2);
  context.beginPath();
  context.arc(food.x * cellWidth + cellWidth / 2, food.y * cellHeight + cellHeight / 2, cellHeight / 2, 0, Math.PI * 2, true);
  context.fill();

  // -- render snake head
  context.fillStyle = "green";
  context.fillRect(1 + snake.body[0].x * cellWidth, 1 + snake.body[0].y * cellHeight, cellWidth - 2, cellHeight - 2);

  // -- render snake body
  context.fillStyle = "cyan";
  snake.body.slice(1).forEach((elt) => context.fillRect(1 + elt.x * cellWidth, 1 + elt.y * cellHeight, cellWidth - 2, cellHeight - 2));

  // -- render the bombs
  bombs.forEach((elt) => {
    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "red";
    context.beginPath();
    context.moveTo(1 + elt.x * cellWidth, 1 + elt.y * cellHeight);
    context.lineTo((elt.x + 1) * cellWidth - 1, (elt.y + 1) * cellHeight - 1);
    context.moveTo(1 + elt.x * cellWidth, (elt.y + 1) * cellHeight - 1);
    context.lineTo((elt.x + 1) * cellWidth - 1, 1 + elt.y * cellHeight);
    context.stroke();
  });
};
