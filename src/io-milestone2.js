const { createServer } = require("http");
const { Server } = require("socket.io");
const {Observable} = require("./utils/observable");

let debug = false;

const random = (max) => Math.floor(Math.random() * max);

function * sequence() {
    let i=0;
    while(true) yield ++i; 
}

// iiiiiici
const constants = Object.freeze({
    "d_up": 1,
    "d_right": 2,
    "d_down": 3,
    "d_left": 4,
    "s_alive": 1,
    "s_dead": 2,
});

// manage move
const move = (coord, direction) => {
    if (direction == constants.d_up) coord.y--;
    else if (direction == constants.d_right) coord.x++;
    else if (direction == constants.d_down) coord.y++;
    else coord.x--;
    return coord;
};

// manage game boundaries
const keepInBoundaries = (coord, boundaries) => {
    if (coord.x < 0) coord.x = boundaries.x - 1;
    else if (coord.x >= boundaries.x) coord.x = 0;
    if (coord.y < 0) coord.y = boundaries.y - 1;
    else if (coord.y >= boundaries.y) coord.y = 0;
    return coord;
}

// manage collisions
const hasCollision = (playerCoord, coords) => {
    return coords.some(coord => (coord.x==playerCoord.x)&&(coord.y==playerCoord.y));
}

// manage turn move
const turnClockwise = (direction, clockwise) => {
    let directionsClockwise = [constants.d_up, constants.d_right, constants.d_down, constants.d_left, constants.d_up];
    let directionsAntiClockwise = [constants.d_up, constants.d_left, constants.d_down, constants.d_right, constants.d_up];
    return clockwise?(directionsClockwise[directionsClockwise.findIndex((elt) => elt == direction) + 1])
       :(directionsAntiClockwise[directionsAntiClockwise.findIndex((elt) => elt == direction) + 1]);
};
// iiiiiici

const Player = (socket, playerId, playerName, coord={x:random(20), y:random(20)}, direction=(1+random(4)), state=1, score=0) => { 
    let _coord=coord;
    let _direction=direction;
    let _state=state;
    let _score=score;

    return {
        socket,
        playerId,
        playerName,
        setCoord:coord => _coord=coord,
        getCoord: () => _coord,
        setDirection: direction=> _direction=direction,
        getDirection: () => _direction,
        setState: state => _state=state,
        getState: () => _state,
        getScore: () =>  _score,
        incScore: (val) =>  _score+=val,
        getValues: () => ({playerId, coord:_coord, direction:_direction, state:_state, score:_score}),
    }
};
  

const Game = (intervalBomb=5, nbBombs=10) => {
    let intervalNextBoard =  500;
    let boundaries = { x: 20, y: 20 };
    const bonus = Object.freeze({"move": 1, "time": 5});
    let battelField = Array.from({length:boundaries.x}, (v, i)=>(Array.from({length:boundaries.y}, (v, i)=>bonus.move)));
    return {
        getIntervalBomb : () => intervalBomb*1000,
        getIntervalGame : () => 30*1000,
        getIntervalNextBoard: () => intervalNextBoard,
        getIntervalFaster: () => 5*1000,
        getNbPlayers: () => 2,
        getNbBombs : () => nbBombs,
        getBoundaries : () => boundaries,
        reset : () => { intervalNextBoard = 500; battelField.forEach(col=>col.fill(bonus.move)); }, 
        faster : () => { if((intervalNextBoard*=0.5)<100) intervalNextBoard=100; }, 
        battelField,
        getBonus : () => bonus,
    }
};


const GameControler = () => {
    let intervalBombId;
    let timeoutGameId;
    let intervalNexBordId;
    let intervalFasterId;
    const playerIdSequence = sequence();
  
    const game = Game(2, 20);
    const gameStarted=Observable(false);
    const nextBoardTimer=Observable(0);
    let nbBombs;
    // const players = new Map(players.map(p => ([p.playerId, p.getCoord()])),); // What about using a map ???
    let players = [];
    let bombs = [];
    
    const nextBoard = () => {
        players.forEach(player=>{
            if(player.getState()==constants.s_dead) return;
            
            // move in boundaries
            const playersCoords = players.map(p=>({...p.getCoord()}));  // shadow copy 
            player.setCoord(keepInBoundaries(move(player.getCoord(), player.getDirection()), game.getBoundaries()));

            // collision with bombs detection
            if(hasCollision(player.getCoord(), bombs)) {
                if(debug) console.log(`collision(playerId=[${player.playerId}]) with bomb`);
                player.setState(constants.s_dead);
            } else 
            // collision with players detection
            if(hasCollision(player.getCoord(), playersCoords)) {
                if(true) console.log(`collision(playerId=[${player.playerId}]) with others player(s)`);
                players.filter(p=>(p.getCoord().x==player.getCoord().x)&&(p.getCoord().y==player.getCoord().y)).forEach(p=>p.setState(constants.s_dead));
            } else 
            // increment score
            if(game.battelField[player.getCoord().x][player.getCoord().y]!=0) {
                player.incScore(game.battelField[player.getCoord().x][player.getCoord().y]);
                game.battelField[player.getCoord().x][player.getCoord().y]=0;        
            };
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
                p.socket.emit('nextBoard', players.map(p => p.getValues()));
            });
            if(!players.some(p=>p.getState()==constants.s_alive)) gameStarted.setValue(false);
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
                // bonus for players
                players.forEach(p=>{ if(p.getState()==constants.s_alive) p.incScore(game.getBonus().time); }); 
            }, game.getIntervalFaster());
            
            players.forEach(p=>{
                if(debug) console.log(`send gameStarted to player ${p.playerName}`);
                p.socket.emit('gameStarted', players.map(p => p.getValues()));
            });
        }
        else {
            players.forEach(p=>{
                if(debug) console.log(`send gameOver to player ${p.playerName}`);
                setTimeout(()=>p.socket.emit('gameOver'), 500); // sent with delay to allow redering on client side
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
        addPlayer: (socket, playerName) => { 
            const playerId=playerIdSequence.next().value;
            players.push(Player(socket, playerId, playerName));
            socket.emit('waitingForPlayers', {playerId});
            socket.removeAllListeners("playerTurn");        // important to avoid multiple regitering
            socket.on('playerTurn', ({clockwise}, callback) => { 
                if(!gameStarted.getValue()) return;
                let target=players.find(p=>p.socket.id==socket.id);
                if(target) target.setDirection(turnClockwise(target.getDirection(), clockwise));
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
            gameControler.addPlayer(socket, playerName);           
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



