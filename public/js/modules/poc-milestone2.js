import {sayHi} from './say.js';
import {io} from "./client-dist/socket.io.esm.min.js";
import {random} from "./util.js";
import {Observable, ObservableList} from "./observable.js";

let debug = false;

const User = () => { 
  let playerId;
  const name=Observable();
  const score=Observable(0);
  return {
    id: () => playerId,
    setId: id => playerId=id,
    getName: name.getValue,
    setName: name.setValue,
    onNameChange: name.onChange,
    score,
  }
};

const Player = (playerId, coord, direction, state, score) => { 
  let _coord=coord;
  let _direction=direction;
  const _state=Observable(state);
  let _score=Observable(score);
  return {
    playerId,
    coord: () => _coord,
    direction: () => _direction,
    state: _state,
    score: _score,
    update: (coord, direction, state, score) => { _coord=coord; _direction=direction; _state.setValue(state); _score.setValue(score); }
  }
};

const Game = () => { 
  let boundaries = { x: 20, y: 20 };
  let frameRate =  30; 
  return {
    frameRate: () => frameRate,
    boundaries : () => boundaries,
  }
};

const GameControler = () => {
  const socket = io();
  let user = User();
  let game = Game();
  let players = ObservableList([]);   
  let bombs = [];
  let intervalTimeId;
  let message = Observable();
  const gameState=Observable('init');
  const gameStarted=Observable();
  const refreshTimer = Observable(0);

  const emitPing = (callBack) => socket.emit('ping', {time:new Date().getTime()}, callBack);
  const emitAddPlayer = (callBack) => socket.emit('addPlayer', {playerName: user.getName()}, callBack);
  const emitEndGame = (callBack) => socket.emit('endGame', callBack);
  const emitPlayerTurn = (clockwise, callBack) => socket.emit('playerTurn', {clockwise}, callBack);

  gameStarted.onChange(started=>{
    if(started==undefined) return;
    if(started) {
      intervalTimeId = setInterval(() => refreshTimer.setValue(Date.now()), game.frameRate());
    } else {
      clearInterval(intervalTimeId);
      players.clear();   
      bombs.length = 0;
    }
  });

  // socket notifications
  socket.on('pong', (data) => message.setValue(`networkSpeed=${new Date().getTime()-data.time}ms`));
  socket.on('waitingForPlayers', (data) => {
    if(debug) console.log(`get('waitingForPlayers')=${JSON.stringify(data)}`);
    message.setValue(`Waiting For Players`);
    gameState.setValue('join');
    user.setId(data.playerId);
  });
  socket.on('gameStarted', (data) => {
    if(debug) console.log(`get('gameStarted')=${JSON.stringify(data)}`);
    message.setValue(`Game Started`);
    players.clear();
    data.forEach(p => {
      let player = Player(p.playerId, p.coord, p.direction, p.state, p.score);
      players.add(player);
    })
    gameStarted.setValue(true);
    gameState.setValue('run');
  }); 
  socket.on('gameOver', () => {
    if(debug) console.log(`get('gameOver')`);
    message.setValue(`Game Over`);
    gameStarted.setValue(false);
    gameState.setValue('end');
  });
  socket.on('bomb', (data) => {
    message.setValue(`get('bomb')=${JSON.stringify(data)}`);
    bombs.push(data);
  });
  socket.on('nextBoard', (data) => {
    if(debug) console.log(`get('nextBoard')=${JSON.stringify(data)}`);
    data.forEach(p => (players.find(e => e.playerId==p.playerId)||{update:()=>{}}).update(p.coord, p.direction, p.state, p.score) );    // :)
    user.score.setValue(players.find(p => p.playerId==user.id()).score.getValue());
  });

  emitPing();

  return {
    onAddPlayers: players.onAdd,
    addPlayer: () => emitAddPlayer(error => { if(error) alert(`Error: ${error}`); }),
    endGame: () => emitEndGame(error => { if(error) alert(`Error: ${error}`); }),
    onGameStateChange: gameState.onChange,
    setMessage : message.setValue,
    onMessageChange: message.onChange, 
    setUserName: user.setName,
    onUserNameChange: user.onNameChange,
    onUserScoreChange: user.score.onChange,
    playerTurn: clockwise => { if(gameStarted.getValue()) emitPlayerTurn(clockwise, error => { if(error) alert(`Error: ${error}`); }) },
    onTimeChange: refreshTimer.onChange,
    getPlayers: players.getList,
    getBombs: () => bombs,
    getGameSettings: () => ({playerId:user.id, boundaries:game.boundaries}),
  }  
}

const GameView = (gameController, rootElt, canvas) => {
  let greatingElt=rootElt.querySelector('#hi');
  let messageElt=rootElt.querySelector('#message');
  let userNameElt=rootElt.querySelector('#username');
  let scoreElt=rootElt.querySelector('#score');
  let addPlayerBtn=rootElt.querySelector('#addPlayer');
  let endGameBtn=rootElt.querySelector('#endGame');
  let soundGameOn=document.getElementById("soundGameOn");
  let soundGameEnd=document.getElementById("soundGameEnd");
  let soundBlip=document.getElementById("soundBlip");

  const renderGame = ((canvas, players, bombs, game) => () => {
    const d_up = 1;
    const d_right = 2;
    const d_down = 3;
    const d_left = 4;
    const s_alive = 1;
    const s_dead = 2;

    // if(debug) console.log(`renderGame(playerId=${game.playerId()})`);
    // -- clear the screen
    let context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    let cellWidth = canvas.width/game.boundaries().x;
    let cellHeight = canvas.height/game.boundaries().y;  
    // -- render the players
    players.forEach(player=>{
      if(player.state.getValue()==s_alive) {
        context.fillStyle = (player.playerId==game.playerId())?"green":"cyan";
        context.fillRect(1 + player.coord().x * cellWidth, 1 + player.coord().y * cellHeight, cellWidth - 2, cellHeight- 2);
      }
      else {
        context.strokeStyle = (player.playerId==game.playerId())?"green":"cyan";
        context.strokeRect(1 + player.coord().x * cellWidth, 1 + player.coord().y * cellHeight, cellWidth - 2, cellHeight - 2);
        context.stroke();
      }
    });
  
    // -- render the bombs
    bombs.forEach(bomb => {
      context.lineWidth = 2;
      context.lineCap = "round";
      context.strokeStyle = "red";
      context.beginPath();
      context.moveTo(1 + bomb.x * cellWidth, 1 + bomb.y * cellHeight);
      context.lineTo((bomb.x + 1) * cellWidth - 1, (bomb.y + 1) * cellHeight - 1);
      context.moveTo(1 + bomb.x * cellWidth, (bomb.y + 1) * cellHeight - 1);
      context.lineTo((bomb.x + 1) * cellWidth - 1, 1 + bomb.y * cellHeight);
      context.stroke();
    });

  })(canvas, gameController.getPlayers(), gameController.getBombs(), gameController.getGameSettings());

  userNameElt.oninput = (e) => gameController.setUserName(e.target.value);
  userNameElt.onchange = (e) => greatingElt.innerHTML = sayHi(e.target.value);
  addPlayerBtn.onclick = (e) => gameController.addPlayer();
  endGameBtn.onclick = (e) => gameController.endGame();
  window.addEventListener("keydown", (e) => {
      if (e.repeat) return; //  key is being held down such that it is automatically repeating
      if (e.key === "ArrowRight") gameController.playerTurn(true);
      else if (e.key === "ArrowLeft") gameController.playerTurn(false);
  });

  gameController.onMessageChange(msg=> {
    if(msg==undefined||/^\s*$/.test(msg)) return;
    if(debug) console.log(`Message=[${msg}]`);
    messageElt.innerHTML=msg;
  });
  gameController.onUserNameChange(playerName=> userNameElt.value=playerName);
  gameController.onUserScoreChange(score=> scoreElt.innerHTML=score);
  gameController.onGameStateChange(state=>{
    if(debug) console.log(`GameState=${state}`);
    ['join', 'run'].includes(state)?userNameElt.setAttribute('disabled', 'disabled'):userNameElt.removeAttribute('disabled');
    ['join', 'run'].includes(state)?addPlayerBtn.setAttribute('disabled', 'disabled'):addPlayerBtn.removeAttribute('disabled');
    ['init', 'join', 'end'].includes(state)?endGameBtn.setAttribute('disabled', 'disabled'):endGameBtn.removeAttribute('disabled');
    if(state=='run') soundGameOn.play();
    if(state=='end') soundGameEnd.play();
  });
  gameController.onAddPlayers(player=> player.state.onChange(state => (state==2)&&soundBlip.play()));

  gameController.onTimeChange(_=> renderGame());
}


const init = (placeHolder) => {
  const rootElt = document.querySelector(placeHolder);
  const canvas = rootElt.querySelector('.game-canvas');
  
  let gameControler = GameControler();
  let gameView = GameView(gameControler, rootElt, canvas);
  gameControler.setUserName(`John${random(100)} Do`);
}

//!\ add init() to global scope explicit to be used on onload
window.init = init;

