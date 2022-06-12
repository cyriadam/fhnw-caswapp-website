const { createServer } = require("http");
const { Server } = require("socket.io");
const {Observable} = require("./utils/observable");

let debug = false;

function * sequence() {
    let i=0;
    while(true) yield ++i; 
}

const Game = (intervalBomb=5, nbBombs=10) => {
    let intervalNextBoard =  500;
    let boundaries = { x: 20, y: 20 };
    return {
        getIntervalBomb : () => intervalBomb*1000,
        getIntervalGame : () => 30*1000,
        getIntervalNextBoard: () => intervalNextBoard,
        getIntervalFaster: () => 5*1000,
        getNbPlayers: () => 2,
        getNbBombs : () => nbBombs,
        boundaries : () => boundaries,
        reset : () => { intervalNextBoard = 500; }, 
        faster : () => { if((intervalNextBoard*=0.5)<100) intervalNextBoard=100; }, 
    }
};

const random = (max) => Math.floor(Math.random() * max);

const GameControler = () => {
    let intervalBombId;
    let timeoutGameId;
    let intervalNexBordId;
    let intervalFasterId;
    const playerIdSequence = sequence();
  
    const game = Game(2, 3);
    const gameStarted=Observable(false);
    const nextBoardTimer=Observable(0);
    let nbBombs;
    let players = [];
    let bombs = [];
    
    const d_up = 1;
    const d_right = 2;
    const d_down = 3;
    const d_left = 4;
    const s_alive = 1;
    const s_dead = 2;
    let directionsClockwise = [d_up, d_right, d_down, d_left, d_up];
    let directionsAntiClockwise = [d_up, d_left, d_down, d_right, d_up];

    const turnClockwise = (direction, clockwise) => {
        return clockwise?(directionsClockwise[directionsClockwise.findIndex((elt) => elt == direction) + 1])
        :(directionsAntiClockwise[directionsAntiClockwise.findIndex((elt) => elt == direction) + 1]);
    };
    
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
    };

    const dropBomb = () => {
        if((nbBombs--)>0) {
            const bomb = { x:random(20), y:random(20)};
            bombs.push(bomb);
            players.forEach(p=>{
                if(debug) console.log(`drop a bomb on player ${p.playerName}`);
                p.socket.emit('bomb', bomb);
            });
        } else {
            clearInterval(intervalBombId);
        }
    }

    nextBoardTimer.onChange(now=> { 
        if(now>0) {
            nextBoard();
            players.forEach(p=>{
                if(debug) console.log(`send nextBoard to player ${p.playerName}`);
                p.socket.emit('nextBoard', players.map(({playerId, coord, direction, state}) => ({playerId, coord, direction, state})));
            });
        } 
    });

    gameStarted.onChange(started=>{
        if(debug) console.log(`gameStarted.onChange(${started})`)
        if(started) {
            // init the game
            nbBombs = game.getNbBombs();
            intervalBombId = setInterval(dropBomb, game.getIntervalBomb());
            timeoutGameId = setTimeout(() => gameStarted.setValue(false), game.getIntervalGame());
            intervalNexBordId = setInterval(() => nextBoardTimer.setValue(Date.now()), game.getIntervalNextBoard());
            intervalFasterId = setInterval(()=>{
                game.faster();
                clearInterval(intervalNexBordId);
                intervalNexBordId = setInterval(() => nextBoardTimer.setValue(Date.now()), game.getIntervalNextBoard());
            }, game.getIntervalFaster());
            
            players.forEach(p=>{
                if(debug) console.log(`send gameStarted to player ${p.playerName}`);
                p.socket.emit('gameStarted', players.map(({playerId, coord, direction, state}) => ({playerId, coord, direction, state})));
            });
        }
        else {
            players.forEach(p=>{
                if(debug) console.log(`send gameOver to player ${p.playerName}`);
                p.socket.emit('gameOver');
            });
            players = [];
            bombs=[];
            game.reset();
            clearInterval(intervalBombId);
            clearTimeout(timeoutGameId);
            clearInterval(intervalNexBordId);
            clearInterval(intervalFasterId);
        }
    });
  
    return {
        endGame : () => gameStarted.setValue(false),
        isGameStarted : gameStarted.getValue,
        addPlayer: (player) => { 
            const playerId=playerIdSequence.next().value;
            players.push({...player, playerId, coord: {x:random(20), y:random(20)}, direction:1+random(4), state:s_alive});
            player.socket.emit('waitingForPlayers', {playerId});
            player.socket.on('playerTurn', ({clockwise}, callback) => { 
                let playerData=players.find(p=>p.playerId==playerId);
                if(playerData) playerData.direction=turnClockwise(playerData.direction, clockwise);
                if(callback) callback();    
            });
            gameStarted.setValue(players.length==game.getNbPlayers());
        },
    }
}
  

module.exports = (app) => {
    const httpServer = createServer(app);
    const io = new Server(httpServer, { /* options */ });
    let gameControler = GameControler();

    io.on('connection', (socket) => {
        if(debug) console.log(`New WebSocket(id=${socket.id}) connection (nb connected clients:${io.engine.clientsCount})`);

        socket.emit('message', {text: 'Welcome', createdAt : new Date().getTime()});    // emit ONLY to the connected socket

        socket.on('ping', ({time}, callback) => {
            if(debug) console.log(`WebSocket(id=${socket.id}) send ping(time=${time})`);
            const now = new Date().getTime();
            if(!time||time>now) return callback('Invalid request!');

            socket.emit('pong', {time});                              
            if(callback) callback();             
        });

        socket.on('addPlayer', ({playerName='noname'}, callback) => {
            if(debug) console.log(`WebSocket(id=${socket.id}) send addPlayer(${playerName})`); 
            if(gameControler.isGameStarted()) return callback('Game already started!');    
            gameControler.addPlayer({playerName, socket});           
            if(callback) callback();             
        });

        socket.on('endGame', (callback) => {
            if(debug) console.log(`WebSocket(id=${socket.id}) send endGame()`); 
            if(!gameControler.isGameStarted()) return callback('Game not started!');    
            gameControler.endGame();            
            if(callback) callback();             
        });

        // -- disconnect --
        socket.on('disconnect', () => {
            if(debug) console.log(`WebSocket(id=${socket.id}) disconnect (nb connected clients:${io.engine.clientsCount})`);
        })
    });

    io.engine.on('connection_error', (err) => {
        console.log(`WebSocket connection error`, err);
    });

    return httpServer;
}



