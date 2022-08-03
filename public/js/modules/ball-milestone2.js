import * as Lambda from "./lambda.js";
import { Observable } from "./observable.js";
import { random, toNDecimal } from "./util.js";

export { GameControler, GameView, init, Game };

const init = (tatResults) => {
  Lambda.either(!tatResults.every((item) => item) ? Lambda.Left("tat errors detected") : Lambda.Right("ok"))((err) => {
    alert(err);
  })((err) => {
    console.log("Success : " + err);
  });
};

let debug = false;

let Game = (x, y, width, height) => {
  const boundaries = Lambda.pair(x)(y);
  let cellSize = Lambda.pair(width / Lambda.fst(boundaries))(height / Lambda.snd(boundaries));
  const framerate = 1000 / 24;
  const gravity = 9.81;
  const frottements = 0.99;

  return {
    getFramerate: () => framerate,
    getBoundaries: () => {
      return { x: Lambda.fst(boundaries), y: Lambda.snd(boundaries) };
    },
    getCellSize: () => {
      return { width: Lambda.fst(cellSize), height: Lambda.snd(cellSize) };
    },
    getGravity: () => gravity,
    getFrottements: () => frottements,
  };
};

const GameControler = () => {
  let intervalTimeId;
  let balls = [];
  let game;

  const gameStarted = Observable(false);
  const time = Observable(0);
  const nbBallsActive = Observable(0);
  let nbBalls;

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
      coord: { x: 1 + random(game.getBoundaries().x - 2), y: game.getBoundaries().y - 1 },
      delta: { x: false ? 0 : random(10) / 10, y: false ? 0 : -random(5) / 10 },
      radius: 10 + random(3) * 10,
      elasticity: 0.99,
      color: `rgb(${random(255)},${random(255)},${random(255)})`,
    };
    ball = {
      ...ball,
      box: {
        top: -(ball.radius / game.getCellSize().height),
        right: ball.radius / game.getCellSize().width,
        bottom: ball.radius / game.getCellSize().height,
        left: -(ball.radius / game.getCellSize().width),
      },
    };
    ball = {
      ...ball,
      subscriptions: [],
    };
    return ball;
  };

  const nextBoard = (ball) => {
    if (ball.enable) {
      ball.coordOld = ball.coord;

      // apply the gravity
      ball.delta.y = toNDecimal(ball.delta.y - game.getGravity() / game.getFramerate(), 5);
      ball.coord = { x: ball.coord.x + ball.delta.x, y: ball.coord.y + ball.delta.y };
      if (debug) console.log("nextBoard", JSON.stringify(ball));

      // manage game boundaries
      if (ball.coord.y <= ball.box.bottom) {
        ball.delta.y = toNDecimal(Math.abs(ball.delta.y * ball.elasticity), 5);
        // replace the ball in the boundaries
        ball.coord = { x: ball.coord.x + ball.delta.x, y: ball.box.bottom };
        ball.delta.x = ball.delta.x * game.getFrottements();
        if (false) console.log("nextBoard-Bottom", JSON.stringify(ball));
      }
      if (ball.coord.x + ball.box.right >= game.getBoundaries().x) {
        ball.delta.x = -ball.delta.x;
        // replace the ball in the boundaries
        ball.coord = { x: game.getBoundaries().x - ball.box.right, y: ball.coord.y };
        ball.delta.x = ball.delta.x * game.getFrottements();
        if (debug) console.log("nextBoard-Right", JSON.stringify(ball));
      }
      if (ball.coord.x + ball.box.left <= 0) {
        ball.delta.x = -ball.delta.x;
        // replace the ball in the boundaries
        ball.coord = { x: 0 - ball.box.left, y: ball.coord.y };
        ball.delta.x = ball.delta.x * game.getFrottements();
        if (debug) console.log("nextBoard-Left", JSON.stringify(ball));
      }

      // stop the ball
      if (ball.coord.y === ball.box.bottom && Math.abs(ball.delta.y) < 0.2 && Math.abs(ball.delta.x) < 0.1) {
        if (debug) console.log("nextBoard-Stop", JSON.stringify(ball));
        ball.enable = false;
        nbBallsActive.setValue(nbBallsActive.getValue() - 1);
      }
    }
  };

  gameStarted.onChange((started) => {
    if (started) {
      // remove subscriptions
      balls.forEach((ball) => ball.subscriptions.forEach((listenerRemove) => listenerRemove()));

      // create the balls
      balls = [];
      if (debug) console.log(`create ${nbBalls} balls`);
      Lambda.loopWhile(0)(Lambda.lt(nbBalls))(Lambda.inc(1))((i) => {
        let ball = createBall(i);
        ball.subscriptions.push(time.onChange(() => nextBoard(ball)));
        balls.push(ball);
        nbBallsActive.setValue(nbBallsActive.getValue() + 1);
      });
      intervalTimeId = setInterval(() => {
        time.setValue(Date.now());
      }, game.getFramerate());
    } else clearInterval(intervalTimeId);
  });

  nbBallsActive.onChange((value, oldValue) => {
    if (value == 0 && oldValue != value) gameStarted.setValue(false);
  });

  return {
    init: (val) => (game = val),
    startGame: () => {
      gameStarted.setValue(true);
      // setTimeout(() => { gameStarted.setValue(false) }, 5000);
    },
    setNbBalls: (val) => (nbBalls = val),
    onGameStarted: (subscriber) => gameStarted.onChange(subscriber),
    onTimeChange: (subscribe) => time.onChange(subscribe),
    getBalls: () => balls,
    //  TAT purpose
    nextBoard,
    createBall,
  };
};

const GameView = (gameControler, canvas, backgroundImgElt, controlsElts) => {
  const game = Game(40, 20, canvas.width, canvas.height);
  gameControler.init(game);

  let context = canvas.getContext("2d");
  let oscillator;
  let startGameElt = controlsElts.querySelector("#startGame");
  let nbBallsElt = controlsElts.querySelector("#nbBalls");

  const initBoard = ((context) => () => {
    context.drawImage(backgroundImgElt, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  })(context);

  const initBoardSound = () => {
    var contexteAudio = new (window.AudioContext || window.webkitAudioContext)();
    var oscillator = contexteAudio.createOscillator();
    oscillator.connect(contexteAudio.destination);
    oscillator.type = "square";
    return oscillator;
  };

  /* ----------- */
  const renderSlider = (elt) => () => {
    elt.setAttribute("slider-value", elt.value);
    let percent = ((elt.value - elt.min) * 100) / (elt.max - elt.min);
    elt.style.setProperty("--slider-percent", `${percent}%`);
    elt.style.setProperty(
      "--background",
      getComputedStyle(elt)
        .getPropertyValue("--background-template")
        .replace("[[PERCENT]]", `${describeArc(15, 15, 14, 0, 3.5999 * percent)}`)
    );
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    const d = ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
    return d;
  };

  gameControler.setNbBalls(nbBallsElt.value);
  nbBallsElt.addEventListener("input", (_) => gameControler.setNbBalls(nbBallsElt.value));
  initBoard();

  /* render all slider */
  controlsElts.querySelectorAll("input[type=range].slider").forEach((elt) => {
    renderSlider(elt)();
    elt.addEventListener("input", (_) => renderSlider(elt)());
  });

  /* test purpose */
  controlsElts.querySelectorAll(".slider.test").forEach((elt) => {
    elt.addEventListener("input", (_) => console.log(`elt[${elt.id}].value=${elt.value}`));
  });

  gameControler.onGameStarted((started) => {
    if (started) {
      initBoard();
      startGameElt.setAttribute("disabled", "true");
      nbBallsElt.setAttribute("disabled", "true");
      if (gameControler.getBalls().length == 1) {
        oscillator = initBoardSound();
        oscillator.start();
      }
    } else {
      startGameElt.removeAttribute("disabled");
      nbBallsElt.removeAttribute("disabled");
      if (gameControler.getBalls().length == 1) oscillator.stop();
    }
  });

  const convertToCanvas = ({ x, y }) => {
    return {
      x: x * game.getCellSize().width,
      y: (game.getBoundaries().y - y) * game.getCellSize().height,
    };
  };

  const clearBoard = ((context, background) => () => {
    if (debug) console.log("clearBoard");

    gameControler.getBalls().forEach((ball) => {
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
  })(context, backgroundImgElt);

  const renderBoard = ((context) => () => {
    gameControler.getBalls().forEach((ball) => {
      // -- render ball
      let coord = convertToCanvas(ball.coord);
      if (debug) console.log(` context.arc(${coord.x}, ${coord.y}, ${ball.radius}, 0, Math.PI * 2, true);`);
      context.beginPath();
      context.fillStyle = ball.color;
      context.arc(coord.x, coord.y, ball.radius, 0, Math.PI * 2, true);
      context.fill();
      context.closePath();
    });
  })(context);

  const renderBoardSound = () => {
    if (gameControler.getBalls().length == 1) oscillator.frequency.value = 50 + gameControler.getBalls()[0].coord.y * 10;
  };

  gameControler.onTimeChange((val) => {
    if (val !== 0) {
      clearBoard();
      renderBoard();
      renderBoardSound();
    }
  });
};
