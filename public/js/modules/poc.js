import {sayHi} from './say.js';
import { io } from "./client-dist/socket.io.esm.min.js";

let debug = false;
let players = [];    // [{"playerName":"John Do","coord":{"x":0,"y":18}}]
let bombs = [];
let intervalGameId;
const d_up = 1;
const d_right = 2;
const d_down = 3;
const d_left = 4;
let directionsClockwise = [d_up, d_right, d_down, d_left, d_up];
let directionsAntiClockwise = [d_up, d_left, d_down, d_right, d_up];

const Game = (canvasWidth=0, canvasHeight=0, playerName) => { 
  let score = 0;
  let boundaries = { x: 20, y: 20 };
  let cellWidth = canvasWidth/boundaries.x;
  let cellHeight = canvasHeight/boundaries.y;
  let speed =  500; // game rendering speed
  let gameStarted = false;
  return {
    speed,
    boundaries,
    cellWidth,
    cellHeight,
    playerName,
    gameStarted
  }
};


const nextBoard = (game) => {
  //
  players.forEach(player=>{
    // move the player
    if (player.direction == d_up) player.coord.y--;
    else if (player.direction == d_right) player.coord.x++;
    else if (player.direction == d_down) player.coord.y++;
    else player.coord.x--;

    // manage game boundaries
    if (player.coord.x < 0) player.coord.x = game.boundaries.x - 1;
    else if (player.coord.x >= game.boundaries.x) player.coord.x = 0;
    if (player.coord.y < 0) player.coord.y = game.boundaries.y - 1;
    else if (player.coord.y >= game.boundaries.y) player.coord.y = 0;

     // collision with bombs detection
    if (bombs.some((bomb) => bomb.x==player.coord.x&&bomb.y==player.coord.y)) {
      console.log("> collision with bomb");
      if (!debug) document.getElementById("soundBlip1").play();
    }
  });
};

const renderGame = (game, canvas) => {
  // -- clear the screen
  let context = canvas.getContext("2d");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // -- render the players
  players.forEach(player=>{
    if(player.playerName==game.playerName) context.fillStyle = "green";
    else context.fillStyle = "cyan";
    context.fillRect(1 + player.coord.x * game.cellWidth, 1 + player.coord.y * game.cellHeight, game.cellWidth - 2, game.cellHeight - 2);
  });

  // -- render the bombs
  bombs.forEach((bomb) => {
    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "red";
    context.beginPath();
    context.moveTo(1 + bomb.x * game.cellWidth, 1 + bomb.y * game.cellHeight);
    context.lineTo((bomb.x + 1) * game.cellWidth - 1, (bomb.y + 1) * game.cellHeight - 1);
    context.moveTo(1 + bomb.x * game.cellWidth, (bomb.y + 1) * game.cellHeight - 1);
    context.lineTo((bomb.x + 1) * game.cellWidth - 1, 1 + bomb.y * game.cellHeight);
    context.stroke();
  });
};



const init = (placeHolder) => {
  const rootElt = document.querySelector(placeHolder);
  const canvas = document.querySelector('.game-canvas');
  rootElt.querySelector('#hi').innerHTML = sayHi('John');
  
  let game;
  const socket = io();
  // emit with acknowledgement callback -run when the event is acknowledged by the server
  const emitPing = (callBack) => socket.emit('ping', {time:new Date().getTime()}, callBack);
  const emitAddPlayer = (playerName, callBack) => socket.emit('addPlayer', {playerName}, callBack);
  const emitEndGame = (callBack) => socket.emit('endGame', callBack);
  const emitPlayerTurn = (playerName, direction, callBack) => {
    console.log(playerName, direction);
    socket.emit('playerTurn', {playerName, direction}, callBack);
  };

  socket.on('pong', (data) => rootElt.querySelector('#message').innerHTML=`lanspeed=${new Date().getTime()-data.time}ms`);
  socket.on('bomb', (data) => {
    rootElt.querySelector('#message').innerHTML=`get('bomb')=${JSON.stringify(data)}`;
    bombs.push(data);
  });
  socket.on('gameOver', () => {
    game.gameStarted=false;
    clearInterval(intervalGameId);
    rootElt.querySelector('#message').innerHTML=`Game Over`;
    if (!debug) document.getElementById("soundGameEnd").play();
  });
  socket.on('gameStarted', (data) => {
    rootElt.querySelector('#message').innerHTML=`Game Started`;
    if(debug) console.log(`get('gameStarted')=${JSON.stringify(data)}`);
    game = Game(canvas.width, canvas.height, rootElt.querySelector('#playername').value);
    game.gameStarted=true;
    players=data;
    if (!debug) document.getElementById("soundGameOn").play();

    intervalGameId = setInterval(() => {
      nextBoard(game);
      renderGame(game, canvas);
    }, game.speed);
  });
  socket.on('waitingForPlayers', () => rootElt.querySelector('#message').innerHTML=`Waiting For Players`);
  socket.on('playerTurn', (data) => {
    console.log(`get playerTurn ${JSON.stringify(data)}`)
    let player = players.find(p => p.playerName == data.playerName);
    if(player) player.direction = data.direction;
  });

  rootElt.querySelector('#addPlayer').onclick = () => {
    emitAddPlayer(rootElt.querySelector('#playername').value, error => {
      if(error) alert(`Error: ${error}`);
    });
    rootElt.querySelector('#hi').innerHTML = sayHi(rootElt.querySelector('#playername').value);
  };
  rootElt.querySelector('#gameend').onclick = () => emitEndGame(error => {
    if(error) alert(`Error: ${error}`);
  }); 

  const turnClockwise = (clockwise) => {
    let me=players.find(player=>player.playerName==game.playerName);
    let direction = clockwise?
      (directionsClockwise[directionsClockwise.findIndex((elt) => elt == me.direction) + 1])
      :(directionsAntiClockwise[directionsAntiClockwise.findIndex((elt) => elt == me.direction) + 1]);
      emitPlayerTurn(game.playerName, direction, error => {
        if(error) alert(`Error: ${error}`);
      });
  };

  window.addEventListener("keydown", (e) => {
    if(game.gameStarted) {
      if (e.key === "ArrowRight") turnClockwise(true);
      else if (e.key === "ArrowLeft") turnClockwise(false);
    }
  });

  emitPing();
}

//!\ add init() to global scope explicit to be used on onload
window.init = init;

