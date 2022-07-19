import {sayHi} from './say.js';
import {io} from "./client-dist/socket.io.esm.min.js";
import {random, dom, makeObj, cleanHtml } from "./util.js";
import {Observable, ObservableList, ObservableObject} from "./observable.js";

let debug = true;

const User = () => { 
  let playerId;
  const name=Observable();
  const score=Observable(0);
  const nbBullets=Observable(0);
  return {
    id: () => playerId,
    setId: id => playerId=id,
    getName: name.getValue,
    setName: name.setValue,
    onNameChange: name.onChange,
    score,
    nbBullets,
  }
};

const Player = (playerId, coord, direction, state, score, nbBullets) => { 
  let _coord=coord;
  let _direction=direction;
  const _state=Observable(state);
  let _score=score;           
  let _nbBullets=nbBullets;   
  return {
    playerId,
    coord: () => _coord,
    direction: () => _direction,
    state: _state,
    score: () => _score,
    nbBullets: () => _nbBullets,
    update: (coord, direction, state, score, nbBullets) => { _coord=coord; _direction=direction; _state.setValue(state); _score=score; _nbBullets=nbBullets; }
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


const PartiesInfoController = (socket) => {
    const partiesInfo=Observable([]);
    const emitPartiesInfoSubscribe = (callBack) => socket.emit('partiesInfoSubscribe', callBack);
  
    socket.on('partiesInfo', (data) => {
        if(debug) console.log(`PartiesInfoController.get('partiesInfo')=${JSON.stringify(data)}`);
        partiesInfo.setValue(data);
      });

      socket.on('init', () => {
        if(debug) console.log(`PartiesInfoController.get('init')`);
        emitPartiesInfoSubscribe();
      });

    return {
      partiesInfo,
    }
  }

const HallOfFameController = (socket) => {
  const hallOfFame=Observable([]);
  const emitHofSubscribe = (callBack) => socket.emit('hofSubscribe', callBack);
  const emitHofReset = (callBack) => socket.emit('hofReset', callBack);
  const emitHofAddComment = (playerId, comment, callBack) => socket.emit('hofAddComment', {playerId, comment}, callBack);

  socket.on('hallOfFame', (data) => {
    if(debug) console.log(`HallOfFameController.get('hallOfFame')=${JSON.stringify(data)}`);
      hallOfFame.setValue(data);
  });

  socket.on('init', () => {
    if(debug) console.log(`HallOfFameController.get('init')`);
      emitHofSubscribe();
  });

  return {
    hallOfFame,
    hofReset: () => emitHofReset(),
    hofAddComment: emitHofAddComment,
  }
}


const DataPoolController = (socket) => {
    const obsListOut = {};
    const obsListIn = {};

    const hasObs = obsList => name => obsList.hasOwnProperty(name);
    const getObs = obsList => (name, initialValue = null) => { return hasObs(obsList)(name)?obsList[name]:obsList[name]=Observable(initialValue); }

    const hasObsOut = hasObs(obsListOut);
    const hasObsIn = hasObs(obsListIn);
    const getObsIn = getObs(obsListIn);

    const getObsOut = ( obsList => (name, initialValue = null) => {
        if (!hasObs(obsList)(name)) {
            const obs = Observable(initialValue);
            obs.onChange(value => { if (value != null) emitSetDataPoolValue(makeObj(name, value)); });
            obsList[name] = obs;
        }
        return obsList[name];
    }
    )(obsListOut);

    const emitDataPoolSubscribe = (callBack) => {
        console.log(`emitDataPoolSubscribe ()`)
        socket.emit('dataPoolSubscribe', callBack);
    }

    const emitSetDataPoolValue = (data, callBack) => {
        console.log(`emitSetDataPoolValue (${JSON.stringify(data)})`)
        socket.emit('setDataPoolValue', data, callBack);
    }

    socket.on('init', () => {
        if(debug) console.log(`get('init')`);
        emitDataPoolSubscribe();
    });

    socket.on('dataPoolValue', (data) => {
        if(debug) console.log(`get('dataPoolValue')=${JSON.stringify(data)}`);
        const name = Object.keys(data)[0];
        // set the data to the observables list or directly to html document if exist 
        if(hasObsIn(name)) getObsIn(name).setValue(data[name]);
        else {
            let elt = document.getElementById(name);
            if(elt) {
                if(elt instanceof HTMLInputElement) elt.value=data[name];
                else elt.innerHTML=data[name];
            }
        }
    });

    return {
        getObsOut, getObsIn, 
    }
}

const GameController = (socket) => {
  let user = User();
  let game = Game();
  let players = ObservableList([]);   
  let bombs = [];
  let intervalTimeId;
  let message = Observable();
  const gameState=Observable('init');
  const gameStarted=Observable();
  const refreshTimer = Observable(0);
  const gameData=Observable({});


  const emitPing = (callBack) => { if (socket.connected) socket.emit('ping', {time:new Date().getTime()}, callBack) };
  const emitNewParty = (nbPlayers, partyName, callBack) => socket.emit('newParty', {nbPlayers, partyName, playerName: user.getName()}, callBack);
  const emitJoinParty = (partyId, callBack) => socket.emit('joinParty', {partyId, playerName: user.getName()}, callBack);
  const emitLeaveParty = (callBack) => socket.emit('leaveParty', callBack); 
  const emitPlayerTurn = (clockwise, callBack) => socket.emit('playerTurn', {clockwise}, callBack);
  const emitPlayerDropBomb = (callBack) => socket.emit('playerDropBomb', callBack);

  let hofAddComment;

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
  socket.on('connect_error', (err) => console.log('Error connecting to server...'));
  socket.on('pong', (data) => message.setValue(`networkSpeed=${new Date().getTime()-data.time}ms`));
  socket.on('message', (data) => message.setValue(data.message));
  socket.on('gameStarted', (data) => {
    if(debug) console.log(`get('gameStarted')=${JSON.stringify(data)}`);
    message.setValue(`Game Started`);
    players.clear();
    data.forEach(p => {
      let player = Player(p.playerId, p.coord, p.direction, p.state, p.score, p.nbBullets);
      players.add(player);
    })
    gameStarted.setValue(true);
    gameState.setValue('run');
  }); 
  socket.on('gameOver', (data) => {
    if(debug) console.log(`get('gameOver')=${JSON.stringify(data)}`);
    message.setValue(`Game Over`);
    gameStarted.setValue(false);
    gameState.setValue('end');
    if(hofAddComment&&data.highScore) {
        let comment = prompt("Congratulation!\nYou have a highScore!\n\nPlease enter a comment ...");
        hofAddComment(user.id(), comment);
    }
  });
  socket.on('bomb', (data) => {
    message.setValue(`get('bomb')=${JSON.stringify(data)}`);
    bombs.push(data);
  });
  socket.on('nextBoard', (data) => {
    if(debug) console.log(`get('nextBoard')=${JSON.stringify(data)}`);
    data.forEach(p => (players.find(e => e.playerId==p.playerId)||{update:()=>{}}).update(p.coord, p.direction, p.state, p.score, p.nbBullets) );    // :)
    user.score.setValue(players.find(p => p.playerId==user.id()).score());
    user.nbBullets.setValue(players.find(p => p.playerId==user.id()).nbBullets());
  });
  socket.on('partyTimeOut', () => {
    if(debug) console.log(`get('partyTimeOut')`);
    message.setValue(`Party Cancelled`);
    gameState.setValue('cancel');
  });
  socket.on('partyLocked', () => {
    if(debug) console.log(`get('partyLocked')`);
    message.setValue(`Party Locked`);
    gameState.setValue('locked');
  });
  socket.on('init', () => {
    if(debug) console.log(`get('init')`);
    emitPing();
  });
  socket.on('gameData', (data) => {
    if(debug) console.log(`get('gameData')=${JSON.stringify(data)}`);
    gameData.setValue(data);
  });

  return {
    onAddPlayers: players.onAdd,
    newParty: (nbPlayers, partyName) => emitNewParty(nbPlayers, partyName, res => {  
      if(res.error) { alert(`Error: ${res.error}`); return; }
      user.setId(res.data.playerId);
      if(gameState.getValue()!='locked') {
        gameState.setValue('join');
        message.setValue(`party [${partyName}] created and waiting for other players to join...`);  // iici message if nbPlayer = 1
      }
    }),
    joinParty: (partyId) => {
        emitJoinParty(partyId, res => {
          if(res.error) { alert(`Error: ${res.error}`); return; }
          user.setId(res.data.playerId);
          if(gameState.getValue()!='locked') {
            gameState.setValue('join');
            message.setValue(`join party [${partyId}] and waiting for other players to join...`);
          }
       })
    },
    leaveParty: () => emitLeaveParty(res => {
      if(res.error) { alert(`Error: ${res.error}`); return; }
      message.setValue(`left the current party ...`);
      gameState.setValue('cancel');
    }),

    onGameStateChange: gameState.onChange,
    setMessage : message.setValue,
    onMessageChange: message.onChange, 
    setUserName: user.setName,
    getUserName: user.getName,
    onUserNameChange: user.onNameChange,
    onUserScoreChange: user.score.onChange,
    onUserNbBulletsChange: user.nbBullets.onChange,
    playerTurn: clockwise => { if(gameStarted.getValue()) emitPlayerTurn(clockwise, error => { if(error) alert(`Error: ${error}`); }) },
    onTimeChange: refreshTimer.onChange,
    getPlayers: players.getList,
    getBombs: () => bombs,
    getGameSettings: () => ({playerId:user.id, boundaries:game.boundaries}),
    playerDropBomb: () => { if(gameStarted.getValue()&&(user.nbBullets.getValue()>0)) emitPlayerDropBomb(error => { if(error) alert(`Error: ${error}`); }) },
    onGameDataChange: gameData.onChange,
    bindHofAddComment: (bindFunction) => hofAddComment=bindFunction,
  }  
}

const HallOfFameView = (hallOfFameController, rootElt) => {
  let hallOfFameContainer=rootElt.querySelector('#hallOfFame');

  const render = (scores) => {
    hallOfFameContainer.innerHTML = '';
    scores.forEach(item=> {
      const playerNameElt = document.createElement('span');
      playerNameElt.textContent = item.playerName;
      const playerScoreElt = document.createElement('span');
      playerScoreElt.textContent = item.score;
      const playerCommentElt = document.createElement('span');
      playerCommentElt.textContent = item.comment;
      const playerDateElt = document.createElement('span');
      playerDateElt.textContent = item.createdAt>0?(new Date(item.createdAt)).toLocaleDateString():'';
      hallOfFameContainer.appendChild(playerNameElt);
      hallOfFameContainer.appendChild(playerScoreElt);
      hallOfFameContainer.appendChild(playerCommentElt);
      hallOfFameContainer.appendChild(playerDateElt);
    });
  }

  hallOfFameController.hallOfFame.onChange(render);
}

const PartiesInfoView = (partiesInfoController, gameController, rootElt) => {
    let enable = Observable(true);

    let partiesInfoContainer=rootElt.querySelector('#partiesInfo');
  
    const clickHandler = (e => {
        if(e.target.type=='button'&&e.target.id.match(/^PARTY(.*)_JOIN$/)) {
            const partyId = e.target.id.match(/^PARTY(.*)_JOIN$/)[1];
            gameController.joinParty(partyId);
        }
    })

    const joinPartyBtnsEnable = (enable) => rootElt.querySelectorAll('input[type=button].joinPartyBtn').forEach(elt=> enable?elt.removeAttribute('disabled'):elt.setAttribute('disabled', 'disabled')); 
    enable.onChange(joinPartyBtnsEnable);

    gameController.onGameStateChange(state=>{
        if(debug) console.log(`GameState=${state}`);
        enable.setValue(!['join', 'locked', 'run'].includes(state));
      });

    const render = (partiesInfo) => {
        if(!partiesInfoContainer.onclick) partiesInfoContainer.onclick=clickHandler;
        partiesInfoContainer.innerHTML = '';
        partiesInfo.forEach(item=> {
            const nameElt = document.createElement('span');
            nameElt.textContent = item.name;
            const nbPlayersElt = document.createElement('span');
            nbPlayersElt.textContent = `${item.nbPlayers} player(s)`;
            const createdByElt  = document.createElement('span');
            createdByElt.textContent = `by ${item.createdBy}`;
            const createdDateElt = document.createElement('span');
            createdDateElt.textContent = item.createdAt>0?`${(new Date(item.createdAt)).toLocaleTimeString()}`:'';
            const statusElt  = document.createElement('span');
            statusElt.textContent = item.status;
            const playersElt  = document.createElement('span');
            playersElt.textContent = item.players.length>0?`with ${item.players.map(e=>e.playerName).join(', ')}`:'';
            const joinBtn = dom(`<input id="PARTY${item.id}_JOIN" type="button" class="btn joinPartyBtn" ${enable.getValue()?'':'disabled="disabled"'} value="Join Party"></input>`);

            partiesInfoContainer.appendChild(nameElt);
            partiesInfoContainer.appendChild(nbPlayersElt);
            partiesInfoContainer.appendChild(createdByElt);
            partiesInfoContainer.appendChild(createdDateElt);
            partiesInfoContainer.appendChild(statusElt);
            partiesInfoContainer.appendChild(playersElt);
            partiesInfoContainer.appendChild(joinBtn);
        });
    }
  
    partiesInfoController.partiesInfo.onChange(render);
  }

  
const GameView = (gameController, hallOfFameController, dataPoolController, rootElt, canvas) => {
  let greatingElt=rootElt.querySelector('#hi');
  let messageElt=rootElt.querySelector('#message');
  let userNameElt=rootElt.querySelector('#username');
  let scoreElt=rootElt.querySelector('#score');
  let nbBulletsElt=rootElt.querySelector('#nbBullets');
  let backgroundElt=rootElt.querySelector('#background');
  let nbPlayersElt=rootElt.querySelector('#nbPlayers');
  let partyNameElt=rootElt.querySelector('#partyName');
  let newPartyBtn=rootElt.querySelector('#newParty');
  let leavePartyBtn=rootElt.querySelector('#leaveParty');
  let soundGameOn=document.getElementById("soundGameOn");
  let soundGameEnd=document.getElementById("soundGameEnd");
  let soundBlip=document.getElementById("soundBlip");
  let highScoreElt=rootElt.querySelector('#highScore');
  let currPartyNameElt=rootElt.querySelector('#currPartyName');
  let currPartyNbPlayersElt=rootElt.querySelector('#currPartyNbPlayers');
  let currPartyTimerElt=rootElt.querySelector('#currPartyTimer');
  // --
  let resetHofBtn=rootElt.querySelector('#resetHof');
  let welcomeTextInputElt=rootElt.querySelector('#welcomeTextInput');
  let nbPlayerBulletsElt=rootElt.querySelector('#nbPlayerBullets');
  let nbBombsElt=rootElt.querySelector('#nbBombs');
  let gameDurationElt=rootElt.querySelector('#gameDuration');
  let gameTimeOutElt=rootElt.querySelector('#gameTimeOut');
  let welcomeTxtElt=rootElt.querySelector('#welcomeTxt');
  // --
  let cellImgElt=document.querySelector('#cellImg');
  let cellDeadImgElt=document.querySelector('#cellDeadImg');
  let virusImgElt=document.querySelector('#virusImg');
  let virusDeadImgElt=document.querySelector('#virusDeadImg');
  let bombImgElt=document.querySelector('#bombImg');
  // -- ChatRoom
  let chatMsgElt=rootElt.querySelector('#chatMsg');
  let chatRoomElt=rootElt.querySelector('#chatRoom');

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
    context.clearRect(0, 0, canvas.width, canvas.height);
    let cellWidth = canvas.width/game.boundaries().x;
    let cellHeight = canvas.height/game.boundaries().y;  
    // == skin minimaliste ==
    // -- render the players
    // players.forEach(player=>{
    //     if(player.state.getValue()==s_alive) {
    //       context.fillStyle = (player.playerId==game.playerId())?"green":"cyan";
    //       context.fillRect(1 + player.coord().x * cellWidth, 1 + player.coord().y * cellHeight, cellWidth - 2, cellHeight- 2);
    //     }
    //     else {
    //       context.strokeStyle = (player.playerId==game.playerId())?"green":"cyan";
    //       context.strokeRect(1 + player.coord().x * cellWidth, 1 + player.coord().y * cellHeight, cellWidth - 2, cellHeight - 2);
    //       context.stroke();
    //     }
    // });
    // -- render the bombs
    // bombs.forEach(bomb => {
    //     context.lineWidth = 2;
    //     context.lineCap = "round";
    //     context.strokeStyle = "red";
    //     context.beginPath();
    //     context.moveTo(1 + bomb.x * cellWidth, 1 + bomb.y * cellHeight);
    //     context.lineTo((bomb.x + 1) * cellWidth - 1, (bomb.y + 1) * cellHeight - 1);
    //     context.moveTo(1 + bomb.x * cellWidth, (bomb.y + 1) * cellHeight - 1);
    //     context.lineTo((bomb.x + 1) * cellWidth - 1, 1 + bomb.y * cellHeight);
    //     context.stroke();
    //   });
    // -- skin cells --
    bombs.filter(bomb=>players.find(player=>player.coord().x==bomb.x&&player.coord().y==bomb.y)==undefined).forEach(bomb=>context.drawImage(bombImgElt, bomb.x*cellWidth -4, bomb.y*cellHeight -4, cellWidth +8, cellHeight +8));
    players.filter(player=>player.playerId==game.playerId()).forEach(player=>context.drawImage(player.state.getValue()==s_alive?cellImgElt:cellDeadImgElt, player.coord().x*cellWidth -4 , player.coord().y*cellHeight -4, cellWidth+8, cellHeight+8));
    players.filter(player=>player.playerId!=game.playerId()).forEach(player=>context.drawImage(player.state.getValue()==s_alive?virusImgElt:virusDeadImgElt, player.coord().x*cellWidth -6 , player.coord().y*cellHeight -6, cellWidth+12, cellHeight+12));

  })(canvas, gameController.getPlayers(), gameController.getBombs(), gameController.getGameSettings());

  const handleKeyBoard = (e) => {
    if (e.repeat) return; //  key is being held down such that it is automatically repeating
    if (e.code === "ArrowRight") { e.preventDefault(); gameController.playerTurn(true); }
    else if (e.code === "ArrowLeft") { e.preventDefault(); gameController.playerTurn(false); }
    else if (e.code === "Space") { e.preventDefault(); gameController.playerDropBomb(); }
  };

  userNameElt.oninput = (e) => gameController.setUserName(e.target.value);
  userNameElt.onchange = (e) => greatingElt.innerHTML = sayHi(e.target.value);
  newPartyBtn.onclick = (e) => gameController.newParty(nbPlayersElt.value, partyNameElt.value);
  leavePartyBtn.onclick = (e) => gameController.leaveParty();
  resetHofBtn.onclick = (e) => hallOfFameController.hofReset();

  gameController.onMessageChange(msg=> {
    if(msg==undefined||/^\s*$/.test(msg)) return;
    if(debug) console.log(`Message=[${msg}]`);
    messageElt.innerHTML=msg;
  });
  gameController.onUserNameChange(playerName=> userNameElt.value=playerName);
  gameController.onUserScoreChange(score=> scoreElt.innerHTML=score);
  gameController.onUserNbBulletsChange(nbBullets=> nbBulletsElt.innerHTML=nbBullets);
  gameController.onGameDataChange(data=>{
    currPartyNameElt.innerHTML=data.partyName||'';
    currPartyNbPlayersElt.innerHTML=data.nbPlayers||'';
    currPartyTimerElt.innerHTML=data.timer||'';
  });
  gameController.onGameStateChange(state=>{
    if(debug) console.log(`GameState=${state}`);
    window.removeEventListener("keydown", handleKeyBoard);

    ['join', 'locked', 'run'].includes(state)?userNameElt.setAttribute('disabled', 'disabled'):userNameElt.removeAttribute('disabled');
    ['join', 'locked', 'run'].includes(state)?nbPlayersElt.setAttribute('disabled', 'disabled'):nbPlayersElt.removeAttribute('disabled');
    ['join', 'locked', 'run'].includes(state)?partyNameElt.setAttribute('disabled', 'disabled'):partyNameElt.removeAttribute('disabled');
    ['join', 'locked', 'run'].includes(state)?newPartyBtn.setAttribute('disabled', 'disabled'):newPartyBtn.removeAttribute('disabled');
    ['init', 'locked', 'run', 'end', 'cancel'].includes(state)?leavePartyBtn.setAttribute('disabled', 'disabled'):leavePartyBtn.removeAttribute('disabled');

    if(state=='run') {
      backgroundElt.classList.add("on");
      window.addEventListener("keydown", handleKeyBoard);
      soundGameOn.play();
    }
    if(state=='end') {
      backgroundElt.classList.remove("on");
      soundGameEnd.play();
    }
  });
  gameController.onAddPlayers(player=> player.state.onChange(state => (state==2)&&soundBlip.play()));

  hallOfFameController.hallOfFame.onChange(scores=> highScoreElt.innerHTML=scores.reduce((acc, curr) => curr.score>acc?curr.score:acc, 0));

  gameController.onTimeChange(_=> renderGame());

  //!\ NEVER oninput to avoid loop event with dataPoolController !!! /!\
  dataPoolController.getObsIn('nbPlayerBullets').onChange(val => nbPlayerBulletsElt.value=val);
  nbPlayerBulletsElt.onchange = (e) => dataPoolController.getObsOut('nbPlayerBullets').setValue(e.target.value);
  dataPoolController.getObsIn('nbBombs').onChange(val => nbBombsElt.value=val);
  nbBombsElt.onchange = (e) => dataPoolController.getObsOut('nbBombs').setValue(e.target.value);
  dataPoolController.getObsIn('gameDuration').onChange(val => gameDurationElt.value=val);
  gameDurationElt.onchange = (e) => dataPoolController.getObsOut('gameDuration').setValue(e.target.value); 
  dataPoolController.getObsIn('gameTimeOut').onChange(val => gameTimeOutElt.value=val);
  gameTimeOutElt.onchange = (e) => dataPoolController.getObsOut('gameTimeOut').setValue(e.target.value); 
  dataPoolController.getObsIn('welcomeText').onChange(val => welcomeTextInputElt.value=val);
  welcomeTextInputElt.onchange = (e) => dataPoolController.getObsOut('welcomeText').setValue(e.target.value); 
  dataPoolController.getObsIn('welcomeText').onChange(val => welcomeTxtElt.innerHTML=val);

  chatMsgElt.onchange = (e) => {
    if(e.target.value==undefined||/^\s*$/.test(e.target.value)) return;
    // dataPoolController.getObsOut('chatMsg').setValue(e.target.value); 
    dataPoolController.getObsOut('chatMsg').setValue(JSON.stringify({userName:gameController.getUserName(), createdAt: new Date().getTime(), text:e.target.value})); 
    e.target.value='';
  } 
  dataPoolController.getObsIn('chatMsg').onChange( val => {
    if(val==undefined||/^\s*$/.test(val)) return;
    const data = JSON.parse(val);
    chatRoomElt.appendChild(dom(`<span>[${new Date(data.createdAt).toLocaleTimeString()}] ${data.userName==gameController.getUserName()?'>':'<'} <strong>${data.userName.toUpperCase()}</strong> : "${data.text}"</span>`));
    // iici
    chatRoomElt.appendChild(dom(`<br/>`));
  });


}

// ---- js test -----
// ------------------

const init = (placeHolder) => {
  const socket = io();
  const rootElt = document.querySelector(placeHolder);
  const canvas = rootElt.querySelector('.game-canvas');
  
  let gameController = GameController(socket);
  let hallOfFameController = HallOfFameController(socket);
  gameController.bindHofAddComment(hallOfFameController.hofAddComment);
  let partiesInfoController = PartiesInfoController(socket);
  let dataPoolController = DataPoolController(socket);
  let gameView = GameView(gameController, hallOfFameController, dataPoolController, rootElt, canvas);
  let hallOfFameView = HallOfFameView(hallOfFameController, rootElt);
  let partiesInfoView = PartiesInfoView(partiesInfoController, gameController, rootElt);

  gameController.setUserName(`John${random(100)} Do`);
  // prevent all input fields from html injection
  [...document.querySelectorAll('input, textarea')].forEach(elt=> elt.addEventListener("input", (e) => cleanHtml(e.target)));
}

//!\ add init() to global scope explicit to be used on onload
window.init = init;
