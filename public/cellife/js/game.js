import { random, playSound, checkFieldLength, clearError, onDialogSubmit } from "./utils/general.js";
import { Observable, ObservableList } from "./utils/observable.js";
import { renderSlider } from "./utils/slider.js";
import { properties as menuProperties } from "./menu.js";
import { Scheduler } from "./utils/dataflow.js";
import * as Lambda from "./utils/lambda.js";
import * as Log from "./utils/log4js.js";

export { GameController, GameView };

Log.setLogLevel(Log.LEVEL_ERROR);

const User = () => {
  let playerId;
  const name = Observable();
  const score = Observable(0);
  const nbBullets = Observable(0);
  return {
    id: () => playerId,
    setId: (id) => (playerId = id),
    getName: name.getValue,
    setName: name.setValue,
    onNameChange: name.onChange,
    score,
    nbBullets,
  };
};

const Player = (playerId, coord, direction, stateValue, score, nbBullets) => {
  const state = Observable(stateValue);
  return {
    playerId,
    coord: () => coord,
    direction: () => direction,
    state,
    score: () => score,
    nbBullets: () => nbBullets,
    update: (coordValue, directionValue, stateValue, scoreValue, nbBulletsValue) => {
      coord = coordValue;
      direction = directionValue;
      state.setValue(stateValue);
      score = scoreValue;
      nbBullets = nbBulletsValue;
    },
  };
};

const Game = () => {
  let boundaries = { x: 20, y: 20 };
  let frameRate = 30;
  return {
    frameRate: () => frameRate,
    boundaries: () => boundaries,
  };
};

const GameController = (socket, hallOfFameController, partyController, menuController) => {
  let user = User();
  let game = Game();
  let players = ObservableList([]);
  let bombs = [];
  let intervalTimeId;
  let message = Observable();
  const gameState = Observable("init");
  const gameStarted = Observable();
  const refreshTimer = Observable(0);
  const gameData = Observable({});

  const emitPing = (callBack) => {
    if (socket.connected) socket.emit("ping", { time: new Date().getTime() }, callBack);
  };
  const emitPlayerTurn = (clockwise, callBack) => socket.emit("playerTurn", { clockwise }, callBack);
  const emitPlayerDropBomb = (callBack) => socket.emit("playerDropBomb", callBack);

  gameStarted.onChange((started) => {
    if (started == undefined) return;
    if (started) {
      intervalTimeId = setInterval(() => refreshTimer.setValue(Date.now()), game.frameRate());
    } else {
      clearInterval(intervalTimeId);
      players.clear();
      bombs.length = 0;
    }
  });

  gameState.onChange((state) => {
    Log.debug(`GameState=${state}`);
    partyController.enable.setValue(!["join", "locked", "run"].includes(state));
  });

  partyController.partyTimeOut.onChange((timeOut) => {
    if (timeOut) {
      message.setValue(`Party Cancelled`);
      gameState.setValue("cancel");
    }
  });

  partyController.partyLocked.onChange((locked) => {
    if (locked) {
      message.setValue(`Party Locked`);
      gameState.setValue("locked");
    }
  });

  // socket notifications
  socket.on("connect_error", (err) => console.log("Error connecting to server..."));

  socket.on("pong", (data) => message.setValue(`networkSpeed is ${new Date().getTime() - data.time}ms`));

  socket.on("message", (data) => message.setValue(data.message));

  socket.on("gameStarted", (data) => {
    Log.debug(`GameController.get('gameStarted')=${JSON.stringify(data)}`);
    message.setValue(`Game Started`);
    players.clear();
    data.forEach((p) => {
      let player = Player(p.playerId, p.coord, p.direction, p.state, p.score, p.nbBullets);
      players.add(player);
    });
    gameStarted.setValue(true);
    gameState.setValue("run");
  });

  socket.on("gameOver", (data) => {
    Log.debug(`GameController.get('gameOver')=${JSON.stringify(data)}`);
    message.setValue(`Game Over`);
    gameStarted.setValue(false);
    gameState.setValue(data.highScore ? "highScore" : "gameOver");
  });

  socket.on("bomb", (data) => {
    Log.debug(`GameController.get('bomb')=${JSON.stringify(data)}`);
    bombs.push(data);
  });

  socket.on("nextBoard", (data) => {
    Log.debug(`GameController.get('nextBoard')=${JSON.stringify(data)}`);
    data.forEach((p) => (players.find((e) => e.playerId == p.playerId) || { update: () => {} }).update(p.coord, p.direction, p.state, p.score, p.nbBullets)); // :)
    user.score.setValue(players.find((p) => p.playerId == user.id()).score());
    user.nbBullets.setValue(players.find((p) => p.playerId == user.id()).nbBullets());
  });

  socket.on("init", () => {
    Log.debug(`GameController.get('init')`);
    emitPing();
  });

  socket.on("gameData", (data) => {
    Log.debug(`GameController.get('gameData')=${JSON.stringify(data)}`);
    gameData.setValue(data);
  });

  return {
    onAddPlayers: players.onAdd,
    newParty: (nbPlayers, partyName) =>
      partyController.newParty(nbPlayers, partyName, user.getName(), (res) => {
        if (res.error) {
          alert(`Error: ${res.error}`);
          return;
        }
        user.setId(res.data.playerId);
        if (gameState.getValue() != "locked") {
          gameState.setValue("join");
          message.setValue(`Party ${partyName} created ${nbPlayers == 1 ? "" : "and waiting for other players to join..."}`);
        }
      }),
    joinParty: (partyId) =>
      partyController.joinParty(partyId, user.getName(), (res) => {
        if (res.error) {
          alert(`Error: ${res.error}`);
          return;
        }
        user.setId(res.data.playerId);
        if (gameState.getValue() != "locked") {
          gameState.setValue("join");
          message.setValue(`Join party ${res.data.partyName} and waiting for other players...`);
        }
      }),
    leaveParty: () =>
      partyController.leaveParty((res) => {
        if (res.error) {
          alert(`Error: ${res.error}`);
          return;
        }
        message.setValue(`Left the current party ...`);
        gameState.setValue("cancel");
      }),

    onGameStateChange: gameState.onChange,
    setMessage: message.setValue,
    onMessageChange: message.onChange,
    setUserName: user.setName,
    getUserName: user.getName,
    onUserNameChange: user.onNameChange,
    onUserScoreChange: user.score.onChange,
    onUserNbBulletsChange: user.nbBullets.onChange,
    playerTurn: (clockwise) => {
      if (gameStarted.getValue())
        emitPlayerTurn(clockwise, (error) => {
          if (error) alert(`Error: ${error}`);
        });
    },
    onTimeChange: refreshTimer.onChange,
    getPlayers: players.getList,
    getBombs: () => bombs,
    getGameSettings: () => ({ playerId: user.id, boundaries: game.boundaries }),
    playerDropBomb: () => {
      if (gameStarted.getValue() && user.nbBullets.getValue() > 0)
        emitPlayerDropBomb((error) => {
          if (error) alert(`Error: ${error}`);
        });
    },
    onGameDataChange: gameData.onChange,
    hofAddComment: (comment) => {
      hallOfFameController.hofAddComment(user.id(), comment);
      menuController.open(menuProperties.SECTION_HOF);
    },

    init: () => {
      user.setName(`John${random(100)} Do`);
    },

    openSection: () => {
      document.querySelector("#section-game").classList.add("open-section");
      playSound("AMBIENT.MP3", 0.05, "toggleMusic")();
    },
  };
};

const GameView = (gameController, hallOfFameController, rootElt) => {
  const placeholderExpend = Observable(false);
  const scheduler = Scheduler();

  let canvas = rootElt.querySelector(".game-canvas");

  let messageElt = rootElt.querySelector("#message");
  let userNameElt = rootElt.querySelector("#username");
  let scoreElt = rootElt.querySelector("#score");
  let nbBulletsElt = rootElt.querySelector("#nbBullets");
  let backgroundElt = rootElt.querySelector("#background");
  let nbPlayersElt = rootElt.querySelector("#nbPlayers");
  let partyNameElt = rootElt.querySelector("#partyName");
  let leavePartyBtn = rootElt.querySelector("#leaveParty");
  let newPartyBtn = rootElt.querySelector("#newParty");
  let soundGameOn = document.getElementById("soundGameOn");
  let soundGameEnd = document.getElementById("soundGameEnd");
  let soundBlip = document.getElementById("soundBlip");
  let soundFanfare = document.getElementById("soundFanfare");
  let highScoreElt = rootElt.querySelector("#highScore");
  let currPartyNameElt = rootElt.querySelector("#currPartyName");
  let currPartyTimerElt = rootElt.querySelector("#currPartyTimer");
  let togglePlaceholderElt = rootElt.querySelector("#togglePlaceholder");
  let highScoreCommentElt = rootElt.querySelector("#highScoreComment");
  let messageAnimatedElt = rootElt.querySelector("#message-animated");
  // --
  let newPartyDialog = rootElt.querySelector("#dialog-newParty");
  let highScoreDialog = rootElt.querySelector("#dialog-highScore");
  // --
  let cellImgElt = document.querySelector("#cellImg");
  let cellDeadImgElt = document.querySelector("#cellDeadImg");
  let virusImgElt = document.querySelector("#virusImg");
  let virusDeadImgElt = document.querySelector("#virusDeadImg");
  let bombImgElt = document.querySelector("#bombImg");

  const renderGame = ((canvas, players, bombs, game) => () => {
    const d_up = 1;
    const d_right = 2;
    const d_down = 3;
    const d_left = 4;
    const s_alive = 1;
    const s_dead = 2;

    // -- clear the screen
    let context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    let cellWidth = canvas.width / game.boundaries().x;
    let cellHeight = canvas.height / game.boundaries().y;
    // -- skin cells --
    bombs
      .filter((bomb) => players.find((player) => player.coord().x == bomb.x && player.coord().y == bomb.y) == undefined)
      .forEach((bomb) => context.drawImage(bombImgElt, bomb.x * cellWidth - 4, bomb.y * cellHeight - 4, cellWidth + 8, cellHeight + 8));
    players
      .filter((player) => player.playerId == game.playerId())
      .forEach((player) =>
        context.drawImage(
          player.state.getValue() == s_alive ? cellImgElt : cellDeadImgElt,
          player.coord().x * cellWidth - 4,
          player.coord().y * cellHeight - 4,
          cellWidth + 8,
          cellHeight + 8
        )
      );
    players
      .filter((player) => player.playerId != game.playerId())
      .forEach((player) =>
        context.drawImage(
          player.state.getValue() == s_alive ? virusImgElt : virusDeadImgElt,
          player.coord().x * cellWidth - 6,
          player.coord().y * cellHeight - 6,
          cellWidth + 12,
          cellHeight + 12
        )
      );
  })(canvas, gameController.getPlayers(), gameController.getBombs(), gameController.getGameSettings());

  const handleKeyBoard = (e) => {
    if (e.repeat) return; //  key is being held down such that it is automatically repeating
    if (e.code === "ArrowRight") {
      e.preventDefault();
      gameController.playerTurn(true);
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      gameController.playerTurn(false);
    } else if (e.code === "Space") {
      e.preventDefault();
      gameController.playerDropBomb();
    }
  };

  togglePlaceholderElt.onchange = (e) => placeholderExpend.setValue(e.target.checked);
  placeholderExpend.onChange((expend) => {
    expend
      ? document.getElementById("placeholder-gameboard").classList.add("expend")
      : document.getElementById("placeholder-gameboard").classList.remove("expend");
    togglePlaceholderElt.checked = expend;
  });

  userNameElt.oninput = (e) => gameController.setUserName(e.target.value);
  userNameElt.onchange = (e) => gameController.setMessage(`name changed for ${e.target.value}`);
  userNameElt.onfocus = (e) => clearError(userNameElt);
  partyNameElt.onfocus = (e) => clearError(partyNameElt);

  leavePartyBtn.onclick = (e) => gameController.leaveParty();

  const playAnimation = ((elt) => (msg) => {
    elt.style.animation = "";
    elt.offsetHeight; // important to trigger reflow!
    elt.children[0].setAttribute("data-shadow", msg);
    elt.children[0].innerHTML = msg;
    elt.style.animation = "down-anim 4s forwards, fadeout-anim 1s 5s forwards";
  })(messageAnimatedElt);

  gameController.onMessageChange((msg) => {
    if (msg == undefined || /^\s*$/.test(msg)) return;
    Log.debug(`Message=[${msg}]`);
    messageElt.innerHTML = msg;
  });
  gameController.onUserNameChange((playerName) => (userNameElt.value = playerName));
  gameController.onUserScoreChange((score) => (scoreElt.innerHTML = score));
  gameController.onUserNbBulletsChange(
    (nbBullets) => (nbBulletsElt.innerHTML = Array.from({ length: nbBullets }).reduce((p, c) => p + '<ion-icon name="skull-outline"></ion-icon>', ""))
  );

  gameController.onGameDataChange((data) => {
    currPartyNameElt.innerHTML = data.partyName || "";
    currPartyTimerElt.innerHTML = data.timer || "";
  });
  gameController.onGameStateChange((state) => {
    Log.debug(`GameState=${state}`);
    window.removeEventListener("keydown", handleKeyBoard);

    ["join", "locked", "run"].includes(state) ? userNameElt.setAttribute("disabled", "disabled") : userNameElt.removeAttribute("disabled");
    // ['join', 'locked', 'run'].includes(state)?newPartyBtn.setAttribute('disabled', 'disabled'):newPartyBtn.removeAttribute('disabled');
    // ['init', 'locked', 'run', 'gameOver', 'highScore', 'cancel'].includes(state)?leavePartyBtn.setAttribute('disabled', 'disabled'):leavePartyBtn.removeAttribute('disabled');
    ["join", "locked", "run"].includes(state) ? newPartyBtn.classList.add("none") : newPartyBtn.classList.remove("none");
    ["init", "locked", "run", "gameOver", "highScore", "cancel"].includes(state) ? leavePartyBtn.classList.add("none") : leavePartyBtn.classList.remove("none");
    ["run"].includes(state) ? placeholderExpend.setValue(true) : ["gameOver", "highScore"].includes(state) ? placeholderExpend.setValue(false) : "";
    ["run"].includes(state) ? backgroundElt.classList.add("on") : backgroundElt.classList.remove("on");
    ["run"].includes(state) ? [...rootElt.querySelectorAll(".game-info")].forEach((elt) => elt.classList.remove("hidden")) : "";

    if (["run"].includes(state)) {
      window.addEventListener("keydown", handleKeyBoard);
      soundGameOn.play();
    }
    if (["gameOver"].includes(state)) {
      soundGameEnd.play();
      playAnimation("GameOver!");
    }
    if (["highScore"].includes(state)) {
      soundFanfare.play();
      scheduler.add((ok) => {
        playAnimation("HighScore!");
        messageAnimatedElt.addEventListener("animationend", ok, { once: true });
      });
      scheduler.add((ok) => {
        highScoreDialog.querySelector("form").reset();
        clearError(highScoreCommentElt);
        highScoreDialog.showModal();
        highScoreDialog.querySelector("form").elements[0].focus();
        ok();
      });
    }
  });

  gameController.onAddPlayers((player) => player.state.onChange((state) => state == 2 && soundBlip.play()));

  hallOfFameController.hallOfFame.onChange(
    (scores) => (highScoreElt.innerHTML = scores.reduce((acc, curr) => (curr.score.getValue() > acc ? curr.score.getValue() : acc), 0))
  );

  gameController.onTimeChange((_) => renderGame());

  // dialog create New Party

  const createNewParty = (formElt) => {
    if ([checkFieldLength(userNameElt, 5)].some((r) => !r)) return;
    Log.debug(`createNewParty(nbPlayers=[${formElt["nbPlayers"].value}], partyName=[${formElt["partyName"].value}])`);
    gameController.newParty(nbPlayersElt.value, partyNameElt.value.trim().toUpperCase());
  };

  newPartyBtn.onclick = (e) => {
    newPartyDialog.querySelector("form").reset();
    renderSlider(nbPlayersElt)();
    clearError(partyNameElt);
    newPartyDialog.showModal();
    newPartyDialog.querySelector("form").elements[0].focus();
  };

  newPartyDialog.querySelector("form").addEventListener("submit", (e) => {
    if ([checkFieldLength(partyNameElt, 5)].some((r) => !r)) e.preventDefault();
  });

  onDialogSubmit(newPartyDialog, createNewParty);

  // dialog high Score
  highScoreDialog.querySelector("form").addEventListener("submit", (e) => {
    if ([checkFieldLength(highScoreCommentElt, 2)].some((r) => !r)) e.preventDefault();
  });

  onDialogSubmit(highScoreDialog, (formElt) => gameController.hofAddComment(formElt["highScoreComment"].value));
};
