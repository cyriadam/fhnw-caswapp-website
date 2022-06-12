import {sayHi} from './say.js';
import {io} from "./client-dist/socket.io.esm.min.js";
import {random} from "./util.js";
import {Observable} from "./observable.js";

let debug = true;
const d_up = 1;
const d_right = 2;
const d_down = 3;
const d_left = 4;
const s_alive = 1;
const s_dead = 2;

const Player = () => { 
  let playerId;
  const playerName=Observable();
  return {
    id: () => playerId,
    setId: id => playerId=id,
    getName: playerName.getValue,
    setName: playerName.setValue,
    onNameChange: playerName.onChange,
  }
};

const Game = () => { 
  let score = 0;
  let boundaries = { x: 20, y: 20 };
  let frameRate =  100; 
  return {
    frameRate: () => frameRate,
    boundaries : () => boundaries,
  }
};

const GameControler = () => {
  const socket = io();
  let player = Player();
  let game = Game();
  let players = [];   
  let bombs = [];
  let intervalTimeId;
  let message = Observable();
  const gameState=Observable('init');
  const gameStarted=Observable();
  const time = Observable(0);

  const nextBoard = () => {
    //
    players.forEach(player=>{
      if(player.state==s_dead) return;

      // move the player
      if (player.direction == d_up) player.coord.y--;
      else if (player.direction == d_right) player.coord.x++;
      else if (player.direction == d_down) player.coord.y++;
      else player.coord.x--;
  
      // manage game boundaries
      if (player.coord.x < 0) player.coord.x = game.boundaries().x - 1;
      else if (player.coord.x >= game.boundaries().x) player.coord.x = 0;
      if (player.coord.y < 0) player.coord.y = game.boundaries().y - 1;
      else if (player.coord.y >= game.boundaries().y) player.coord.y = 0;
  
       // collision with bombs detection
      if ((player.state==s_alive&&bombs.some((bomb) => bomb.x==player.coord.x&&bomb.y==player.coord.y))) {
        if(debug) console.log(`collision(playerId=[${player.playerId}]) with bomb`);
        player.state=s_dead;
      }
    });
    if(debug) console.log(`nextBoard(players):${JSON.stringify(players)}`);
  };

  const emitPing = (callBack) => socket.emit('ping', {time:new Date().getTime()}, callBack);
  const emitAddPlayer = (callBack) => socket.emit('addPlayer', {playerName: player.getName()}, callBack);
  const emitEndGame = (callBack) => socket.emit('endGame', callBack);
  const emitPlayerTurn = (playerId, clockwise, callBack) => socket.emit('playerTurn', {playerId, clockwise}, callBack);

  gameStarted.onChange(started=>{
    if(started==undefined) return;
    if(started) {
      intervalTimeId = setInterval(() => time.setValue(Date.now()), game.frameRate());
    } else {
      clearInterval(intervalTimeId);
      players.length = 0;   
      bombs.length = 0;
    }
  });

  time.onChange(_=> nextBoard());

  // socket notifications
  socket.on('pong', (data) => message.setValue(`networkSpeed=${new Date().getTime()-data.time}ms`));
  socket.on('waitingForPlayers', (data) => {
    if(debug) console.log(`get('waitingForPlayers')=${JSON.stringify(data)}`);
    message.setValue(`Waiting For Players`);
    gameState.setValue('join');
    player.setId(data.playerId);
  });
  socket.on('gameStarted', (data) => {
    if(debug) console.log(`get('gameStarted')=${JSON.stringify(data)}`);
    message.setValue(`Game Started`);
    players.push(...data);
    gameStarted.setValue(true);
    gameState.setValue('run');
  });
  socket.on('gameOver', () => {
    if(debug) console.log(`get('gameOver')`);
    message.setValue(`Game Over`);
    gameStarted.setValue(false);
    gameState.setValue('end');
  });
  socket.on('playerTurn', (data) => {
    if(debug) console.log(`get('playerTurn')=${JSON.stringify(data)}`);
    let player = players.find(p => p.playerId == data.playerId);
    if(player) player.direction = data.direction;
  });
  socket.on('bomb', (data) => {
    message.setValue(`get('bomb')=${JSON.stringify(data)}`);
    bombs.push(data);
  });

  emitPing();

  return {
    addPlayer: () => emitAddPlayer(error => { if(error) alert(`Error: ${error}`); }),
    endGame: () => emitEndGame(error => { if(error) alert(`Error: ${error}`); }),
    onGameStateChange: gameState.onChange,
    setMessage : message.setValue,
    onMessageChange: message.onChange, 
    setPlayerName: player.setName,
    onPlayNameChange: player.onNameChange,
    playerTurn: clockwise => { if(gameStarted.getValue()) emitPlayerTurn(player.id, clockwise, error => { if(error) alert(`Error: ${error}`); }) },
    onTimeChange: time.onChange,
    getPlayers: () => players,
    getBombs: () => bombs,
    getGameSettings: () => ({playerId:player.id, boundaries:game.boundaries}),
  }  
}


const GameView = (gameController, rootElt, canvas) => {
  let greatingElt=rootElt.querySelector('#hi');
  let messageElt=rootElt.querySelector('#message');
  let playerNameElt=rootElt.querySelector('#playername');
  let addPlayerBtn=rootElt.querySelector('#addPlayer');
  let endGameBtn=rootElt.querySelector('#endGame');
  let soundGameOn=document.getElementById("soundGameOn");
  let soundGameEnd=document.getElementById("soundGameEnd");
  let soundBlip=document.getElementById("soundBlip");

  const renderGame = ((canvas, players, bombs, game) => () => {
    if(debug) console.log(`renderGame(playerId=${game.playerId()})`);
    // -- clear the screen
    let context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    let cellWidth = canvas.width/game.boundaries().x;
    let cellHeight = canvas.height/game.boundaries().y;  
    // -- render the players
    players.forEach(player=>{
      if(player.state==s_alive) {
        context.fillStyle = (player.playerId==game.playerId())?"green":"cyan";
        context.fillRect(1 + player.coord.x * cellWidth, 1 + player.coord.y * cellHeight, cellWidth - 2, cellHeight- 2);
      }
      else {
        context.strokeStyle = (player.playerId==game.playerId())?"green":"cyan";
        context.strokeRect(1 + player.coord.x * cellWidth, 1 + player.coord.y * cellHeight, cellWidth - 2, cellHeight - 2);
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

  playerNameElt.oninput = (e) => gameController.setPlayerName(e.target.value);
  playerNameElt.onchange = (e) => greatingElt.innerHTML = sayHi(e.target.value);
  addPlayerBtn.onclick = (e) => gameController.addPlayer();
  endGameBtn.onclick = (e) => gameController.endGame();
  window.addEventListener("keydown", (e) => {
      e.preventDefault();
      if (e.repeat) return; //  key is being held down such that it is automatically repeating
      if (e.key === "ArrowRight") gameController.playerTurn(true);
      else if (e.key === "ArrowLeft") gameController.playerTurn(false);
  });

  gameController.onMessageChange(msg=> {
    if(debug) console.log(`Message=[${msg}]`);
    messageElt.innerHTML=msg;
  });
  gameController.onPlayNameChange(playerName=> playerNameElt.value=playerName);
  gameController.onGameStateChange(state=>{
    if(debug) console.log(`GameState=${state}`);
    ['join', 'run'].includes(state)?playerNameElt.setAttribute('disabled', 'disabled'):playerNameElt.removeAttribute('disabled');
    ['join', 'run'].includes(state)?addPlayerBtn.setAttribute('disabled', 'disabled'):addPlayerBtn.removeAttribute('disabled');
    ['init', 'join', 'end'].includes(state)?endGameBtn.setAttribute('disabled', 'disabled'):endGameBtn.removeAttribute('disabled');
    if(state=='run') soundGameOn.play();
    if(state=='end') soundGameEnd.play();
  });

  gameController.onTimeChange(_=> renderGame());
}


const init = (placeHolder) => {
  const rootElt = document.querySelector(placeHolder);
  const canvas = rootElt.querySelector('.game-canvas');

  let gameControler = GameControler();
  let gameView = GameView(gameControler, rootElt, canvas);
  gameControler.setPlayerName(`John${random(100)} Do`);
}

//!\ add init() to global scope explicit to be used on onload
window.init = init;

