const { createServer } = require("http");
const { Server } = require("socket.io");
const {Observable} = require("./utils/observable");

function * sequence() {
    let i=0;
    while(true) yield ++i; 
}

const Game = (intervalBomb=5, nbBombs=10) => {
    return {
      getIntervalBomb : () => intervalBomb*1000,
      getIntervalGame : () => 30*1000,
      getNbPlayers: () => 2,
      getNbBombs : () => nbBombs,
    }
};

const random = (max) => Math.floor(Math.random() * max);

const GameControler = () => {
    let intervalBombId;
    let intervalGameId;
    const playerIdSequence = sequence();
  
    const game = Game(2, 3);
    const gameStarted=Observable(false);
    const time=Observable(0);
    let nbBombs;
    let players = [];

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


  
    const dropBomb = () => {
        // ((nbBombs--)>0)?(_=> {
        //     console.log('drop a bomb')
        // })():(_=> {
        //     clearInterval(intervalBombId)
        // })();
        // ---------
        // either(((nbBombs--)>0)?Left():Right())
        // (()=> {
        //     console.log('drop a bomb');
        // })
        // (() => {
        //     clearInterval(intervalBombId);
        // });

        if((nbBombs--)>0) {
            const bomb = { x:random(20), y:random(20)};
            players.forEach(p=>{
                console.log(`drop a bomb on player ${p.playerName}`);
                p.socket.emit('bomb', bomb);
            });
        } else {
            clearInterval(intervalBombId);
        }
    }

    gameStarted.onChange(started=>{
        console.log(`gameStarted.onChange(${started})`)
        if(started) {
            // init the game
            nbBombs = game.getNbBombs();
            intervalBombId = setInterval(dropBomb, game.getIntervalBomb());
            intervalGameId = setTimeout(() => gameStarted.setValue(false), game.getIntervalGame());
            players.forEach(p=>{
                console.log(`send gameStarted to player ${p.playerName}`);
                p.socket.emit('gameStarted', players.map(({playerId, coord, direction, state}) => ({playerId, coord, direction, state})));
            });
        }
        else {
            players.forEach(p=>{
                console.log(`send gameOver to player ${p.playerName}`);
                p.socket.emit('gameOver');
            });
            players = [];
            clearInterval(intervalBombId);
            clearInterval(intervalGameId);
        }
    });
  
    return {
        // startGame : () => gameStarted.setValue(true),
        endGame : () => gameStarted.setValue(false),
        isGameStarted : gameStarted.getValue,
        addPlayer: (player) => { 
            const playerData = {...player, playerId:playerIdSequence.next().value, coord: {x:random(20), y:random(20)}, direction:1+random(4), state:s_alive}
            players.push(playerData);
            player.socket.emit('waitingForPlayers', {playerId:playerData.playerId});
            player.socket.on('playerTurn', ({clockwise}, callback) => { 
                playerData.direction=turnClockwise(playerData.direction, clockwise);
                players.forEach(p=>{
                    console.log(`send playerTurn(playerId=[${playerData.playerId}], direction=[${playerData.direction}]) to player ${p.playerId}`);
                    p.socket.emit('playerTurn', {playerId:playerData.playerId, direction: playerData.direction});
                });
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
        console.log(`New WebSocket(id=${socket.id}) connection (nb connected clients:${io.engine.clientsCount})`);

        socket.emit('message', {text: 'Welcome', createdAt : new Date().getTime()});    // emit ONLY to the connected socket

        socket.on('ping', ({time}, callback) => {
            // console.log(`WebSocket(id=${socket.id}) send ping(time=${time})`);
            const now = new Date().getTime();
            if(!time||time>now) return callback('Invalid request!');

            socket.emit('pong', {time});                              
            if(callback) callback();             
        });

        socket.on('addPlayer', ({playerName='noname'}, callback) => {
            console.log(`WebSocket(id=${socket.id}) send addPlayer(${playerName})`); 
            if(gameControler.isGameStarted()) return callback('Game already started!');    
            gameControler.addPlayer({playerName, socket});           
            if(callback) callback();             
        });

        socket.on('endGame', (callback) => {
            console.log(`WebSocket(id=${socket.id}) send endGame()`); 
            if(!gameControler.isGameStarted()) return callback('Game not started!');    
            gameControler.endGame();            
            if(callback) callback();             
        });

        // -- disconnect --
        socket.on('disconnect', () => {
            console.log(`WebSocket(id=${socket.id}) disconnect (nb connected clients:${io.engine.clientsCount})`);
        })
    });

    io.engine.on('connection_error', (err) => {
        console.log(`WebSocket connection error`, err);
    });

    return httpServer;
}



