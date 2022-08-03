import * as Lamba from "./lambda.js";
import { Observable, ObservableList } from "./observable.js";
import * as Log from "./log4js.js";

Log.setLogLevel(Log.LEVEL_INFO);

/*
const init = (canvasComponent, addPersonComponent, addInfectedComponent) => {
  Lamba.either(
    (() => {
      // -- perform the testcases
      let $canvas = document.querySelector(canvasComponent);
      let $addPerson = document.querySelector(addPersonComponent);
      let $addInfected = document.querySelector(addInfectedComponent);
      return $canvas == null ||$addPerson == null ||$addInfected == null || !runTests() ? Lamba.Left("game engine errors detected") : Lamba.Right({$canvas, $addPerson, $addInfected});
    })()
  )((err) => {
    // -- error testcases or dom missing eelements
    alert(err);
  })(({$canvas, $addPerson, $addInfected}) => {
    // -- start the game
    try {
      $addPerson.onclick = add(false);
      $addInfected.onclick = add(true);
      initGame($canvas);
      run($canvas);
    } catch (err) {
      alert(err.message);
      console.error(err.message);
    }
  });
};

const runTests = () => {
  console.log('runTests')
  try {
    let testCases = [];

    // -- add testcases

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

*/

const random = (max) => Math.floor(Math.random() * max);

const drawLine = (context, x1, y1, x2, y2) => {
  context.lineWidth = 1;
  context.strokeStyle = "#e6e6fa";
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
};

const distance = (coord1 = { x: 0, y: 0 }, coord2 = { x: 0, y: 0 }) =>
  Math.sqrt(Math.pow(Math.abs(coord1.x - coord2.x), 2) + Math.pow(Math.abs(coord1.y - coord2.y), 2));

Number.prototype.rad2deg = function () {
  return (this * 180) / Math.PI;
};

Number.prototype.rad2deg = function () {
  return (this * 180) / Math.PI;
};

Number.prototype.toRound = function (x) {
  return Number(Number.parseFloat(this).toFixed(x));
};

function* sequence() {
  let i = 0;
  while (true) yield ++i;
}

// ======================================== //

let Game = (x, y, width, height) => {
  const boundaries = Lamba.pair(x)(y);
  let cellSize = Lamba.pair(width / Lamba.fst(boundaries))(height / Lamba.snd(boundaries));
  const framerate = 1000 / 24;
  const maxBullets = 5;
  const newBulletDelay = 10;
  const poison = 5;
  const radius = distance({ x, y }) / 2;

  return {
    getFramerate: () => framerate,
    getBoundaries: () => {
      return { x: Lamba.fst(boundaries), y: Lamba.snd(boundaries) };
    },
    getCellSize: () => {
      return { width: Lamba.fst(cellSize), height: Lamba.snd(cellSize) };
    },
    getMaxBullets: () => maxBullets,
    getNewBulletDelay: () => newBulletDelay,
    getPoison: () => poison,
    getRadius: () => radius,
  };
};

const Controler = (game) => {
  const [Cell, getType, getSpeed, getRadius, getIA, getLifeTime, getEnergyLevel, getBonus, getVision] = Lamba.Tuple(8);
  const [Coordinates, getX, getY, getDistance, getDescription] = Lamba.Tuple(4);
  const cellId = sequence();

  const vidal = [
    Cell("cell", () => 2 + random(3), 1, 0, -1, 1, -1, -1),
    Cell("virus", () => 2 + random(3), 0.8, 0, -1, 3, 1, -1),
    Cell("anticorps", () => 5, 0.5, 2, 20, -1, 0, 0.5),
  ];

  let cure = random(5);
  Log.info(`cure is ${["reduce energyLevel", "kill the virus", "poisoning the virus", "reduce the speed", "increase the speed"][cure]}`);
  let freeze = false;
  let intervalTimeId;
  let intervalTimeInSecId;
  const cellList = ObservableList([]);
  const time = Observable(0);
  const timeInSec = Observable(0);

  let scoreUser = Observable(0);
  let nbOfBullets = Observable(game.getMaxBullets());

  const createCell = (cellType) => {
    //
    let cellDefinition = vidal.find((cell) => getType(cell) == cellType);
    let id = cellId.next().value;
    let type = cellType;
    let radius = getRadius(cellDefinition);
    let ia = getIA(cellDefinition);
    let lifeTime = getLifeTime(cellDefinition);
    let bonus = getBonus(cellDefinition);
    let vision = getVision(cellDefinition);
    let dSpeed;
    let dx;
    let dy;
    let age = 0;
    let scoreCell = 0;
    //
    const infected = Observable(false);
    const energyLevel = Observable(getEnergyLevel(cellDefinition));
    let speed = Observable(getSpeed(cellDefinition)()); // nb units per second
    let direction = Observable(((2 * Math.PI * random(36) * 10) / 360).toRound(2)); // 36 * 10 degres

    const cell = {
      getId: () => id,
      getIA: () => ia,
      getAge: () => age,
      x: game.getBoundaries().x / 2,
      y: game.getBoundaries().y / 2,
      getDx: () => dx,
      getDy: () => dy,
      getType: () => type,
      getRadius: () => radius,
      getVision: () => vision,
      isInfected: () => infected.getValue(),
      setInfected: (byCell) => {
        if (type == "cell" && byCell.getType() == "virus") {
          // cell became a virus
          let cellDefinition = vidal.find((cell) => getType(cell) == byCell.getType());
          type = byCell.getType();
          speed.setValue(getSpeed(cellDefinition)());
          radius = getRadius(cellDefinition);
          lifeTime = getLifeTime(cellDefinition);
          ia = getIA(cellDefinition);
          age = 0;
          infected.setValue(true);
          scoreUser.setValue(scoreUser.getValue() + bonus);
        } else if (type == "virus" && byCell.getType() == "anticorps") {
          // anticorps kill the virus
          lifeTime = age; // subscriber will be removed with timeInSec.onChange()
          cellList.del(cell);
        }
        byCell.incrementScore(1, energyLevel.getValue());
      },
      getDirection: () => direction.getValue(),
      setDirection: (newDirection) => {
        let dDirection = (Math.floor((newDirection - direction.getValue()).rad2deg()) + 360) % 360;
        if (dDirection > 5) newDirection = direction.getValue() + (dDirection - 180 > 0 ? 0 - (5 * Math.PI) / 180 : (5 * Math.PI) / 180); // turn smoothly
        direction.setValue(newDirection);
      },
      onInfectedChange: (subscriber) => infected.onChange(subscriber),
      click: () => {
        if (type == "virus") {
          switch (cure) {
            case 0:
              energyLevel.setValue(energyLevel.getValue() - 1);
              break; // reduce energyLevel
            case 1:
              energyLevel.setValue(0);
              break; // kill the virus
            case 2:
              lifeTime = lifeTime < 0 ? game.getPoison() : lifeTime > game.getPoison() ? game.getPoison() : lifeTime;
              break; // poisoning the virus
            case 3:
              speed.setValue(Math.max(1, speed.getValue() - 1));
              break; // reduce the speed
            case 4:
              speed.setValue(speed.getValue() + 1);
              break; // increase the speed
          }
        } else if (type == "anticorps") {
          age = Math.floor(age / 2); // get younger
          let cellDefinition = vidal.find((cell) => getType(cell) == type);
          speed.setValue(Math.min(speed.getValue() * 2, getSpeed(cellDefinition)())); // get faster
        }
      },
      incrementScore: (bonus, food) => {
        scoreCell += bonus;
        food > 0 && energyLevel.setValue(energyLevel.getValue() + food);
        if (scoreCell % 5 == 5) energyLevel.setValue(energyLevel.getValue() + 1); // IICI : what about being more clever ? ia++
      },
    };

    energyLevel.onChange((level) => {
      if (level == 0) {
        cellList.del(cell);
        lifeTime = 0;
      }
    });

    speed.onChange((speed) => {
      dSpeed = lifeTime > 0 ? (speed - 2) / (lifeTime - age) : 0;
      dx = (Math.cos(direction.getValue()) * speed).toRound(2);
      dy = (Math.sin(direction.getValue()) * speed).toRound(2);
    });

    direction.onChange((direction) => {
      dx = (Math.cos(direction) * speed.getValue()).toRound(2);
      dy = (Math.sin(direction) * speed.getValue()).toRound(2);
    });

    timeInSec.onChange((val, oldVal, removeMe) => {
      age++;
      if (lifeTime >= 0) {
        if (age >= lifeTime) {
          Log.info(`cell[${type}-${id}] die at ${age} sec old...`);
          cellList.del(cell);
          removeMe(); // remove the subscriber on timeInsec Observable
          scoreUser.setValue(scoreUser.getValue() + bonus);
        }
        speed.setValue(speed.getValue() - dSpeed); // move slower then older
      }
    });

    Log.info(`create cell[${type}-${id}]`);
    return cell;
  };

  const touching = (cell1, cell2) => {
    return distance(cell1, cell2) < cell1.getRadius() + cell2.getRadius();
  };

  const nextBoard = () => {
    cellList.getList().forEach((cell) => {
      // move
      cell.x = cell.x + (cell.getDx() * game.getFramerate()) / 1000;
      cell.y = cell.y + (cell.getDy() * game.getFramerate()) / 1000;
      // handle boundaries
      cell.x = (cell.x + game.getBoundaries().x) % game.getBoundaries().x;
      cell.y = (cell.y + game.getBoundaries().y) % game.getBoundaries().y;
    });

    const allVirus = cellList.getList().filter((cell) => cell.getType() === "virus");
    const allCells = cellList.getList().filter((cell) => cell.getType() === "cell");
    const allAnticorps = cellList.getList().filter((cell) => cell.getType() === "anticorps");
    if (allVirus.length !== 0 && allCells.length !== 0) {
      // handle collisions
      allVirus.forEach((virus) => {
        allCells.filter((cell) => touching(cell, virus)).forEach((cell) => cell.setInfected(virus));
        allAnticorps.filter((anticorps) => touching(anticorps, virus)).forEach((anticorps) => virus.setInfected(anticorps));
      });
      // anticorps IA
      allAnticorps.forEach((anticorps) => {
        if (anticorps.getIA() > 0) {
          let target;
          allVirus.forEach((virus) => {
            // direct way
            let virusCoordinates;
            if (anticorps.getIA() == 1) virusCoordinates = Coordinates(virus.x, virus.y, distance(anticorps, virus), `target virus=[${virus.getId()}] (case5)`);
            else if (anticorps.getIA() == 2) {
              // search closest way moving out of the screen bounbaries
              let caseId = 1;
              [-1, 0, 1].forEach((i) => {
                [-1, 0, 1].forEach((j) => {
                  let x = virus.x + game.getBoundaries().x * i;
                  let y = virus.y + game.getBoundaries().y * j;
                  let d = distance(anticorps, { x, y });
                  if (!virusCoordinates || d <= getDistance(virusCoordinates))
                    virusCoordinates = Coordinates(x, y, d, `target virus=[${virus.getId()}] (case${caseId})`);
                  caseId++;
                });
              });
            }
            if (!target || getDistance(virusCoordinates) < getDistance(target)) target = virusCoordinates;
          });
          if (target && (anticorps.getVision() < 0 || anticorps.getVision() * game.getRadius() >= getDistance(target))) {
            // Log.debug(`x=${getX(target).toFixed(2)},y=${getY(target).toFixed(2)},distance=${getDistance(target).toFixed(2)}, ${getDescription(target)}`);
            anticorps.setDirection(Math.atan2(getY(target) - anticorps.y, getX(target) - anticorps.x));
          }
        }
      });
    }
  };

  timeInSec.onChange((time) => {
    if (time % game.getNewBulletDelay() == 0) {
      if (nbOfBullets.getValue() < game.getMaxBullets()) {
        Log.log(`add a bullet...`);
        nbOfBullets.setValue(nbOfBullets.getValue() + 1);
      }
    }
  });

  return {
    addCell: (cellType = "cell") => {
      Log.debug(`Controler.addCell(cellType=${cellType})`);
      const cell = createCell(cellType);
      cellList.add(cell);
      return cell;
    },
    onAddCell: (subscriber) => {
      Log.debug("Controler.onAddCell()");
      cellList.onAdd(subscriber);
    },
    onDelCell: (subscriber) => {
      Log.debug("Controler.onDellCell()");
      cellList.onDel(subscriber);
    },
    getCountCells: (cellType) => (cellType ? cellList.countIf((cell) => cell.getType() == cellType) : cellList.count()),
    startGame: () => {
      Log.debug("Controler.startGame()");
      intervalTimeId = setInterval(() => {
        if (!freeze) time.setValue(Date.now());
      }, game.getFramerate() * (Log.getLogLevel() === Log.LEVEL_DEBUG ? 5 : 1));
      intervalTimeInSecId = setInterval(() => {
        if (!freeze) timeInSec.setValue(timeInSec.getValue() + 1);
      }, 1000);
    },
    onTimeChange: (subscriber) => {
      Log.debug("Controler.onTimeChange()");
      time.onChange(subscriber);
    },
    getCells: () => cellList.getList(),
    nextBoard,
    freeze: (state = true) => (freeze = state),
    click: (coord) => {
      let min = cellList
        .getList()
        .map((cell, i) => {
          return { i, d: distance(coord, { x: cell.x, y: cell.y }) };
        })
        .reduce((acc, curr) => (curr.d < acc.d ? curr : acc), { i: -1, d: 100 });
      let cell = cellList.getList()[min.i];
      if (cell && cell.getRadius() > min.d) {
        Log.info(`click on cell[${cell.getType()}-${cell.getId()}]`);

        if (cell.getType() == "cell" || nbOfBullets.getValue() == 0) return;
        nbOfBullets.setValue(nbOfBullets.getValue() - 1);
        cell.click();
      }
    },
    getScore: () => scoreUser.getValue(),
    onScoreChange: (subscriber) => {
      Log.debug("Controler.onScoreChange()");
      scoreUser.onChange(subscriber);
    },
    getNbOfBullets: () => nbOfBullets.getValue(),
    onNbOfBulletsChange: (subscriber) => {
      Log.debug("Controler.onNbOfBulletsChange()");
      nbOfBullets.onChange(subscriber);
    },
  };
};

export const View = (canvas, addCellBtn, addVirusBtn, addAnticorpsBtn, nbOfCells, nbOfVirus, score, nbOfBullets, cellImg, virusImg, anticorpsImg) => {
  const context = canvas.getContext("2d");
  const game = Game(40, 20, canvas.width, canvas.height);
  const controler = Controler(game);

  const convertToCanvas = (x, y = 0) => {
    return {
      x: x * game.getCellSize().width,
      y: (game.getBoundaries().y - y) * game.getCellSize().height,
    };
  };

  const renderStatistics = () => {
    Log.debug("View.renderStatistics()");
    nbOfCells.innerHTML = controler.getCountCells("cell");
    nbOfVirus.innerHTML = controler.getCountCells("virus");
    score.innerHTML = controler.getScore();
    nbOfBullets.innerHTML = controler.getNbOfBullets();
  };

  const clearCell = (cell) => {
    let { x, y } = convertToCanvas(cell.x, cell.y);
    let { x: cellRadius } = convertToCanvas(cell.getRadius());
    context.clearRect(x - cellRadius - 1, y - cellRadius - 1, cellRadius * 2 + 2, cellRadius * 2 + 2);
  };

  const renderBoard = () => {
    Log.getLogLevel() === Log.LEVEL_DEBUG
      ? (() => {
          // then
          for (let i = 0; i <= game.getBoundaries().x; i++)
            drawLine(context, ...Object.values(convertToCanvas(i, 0)), ...Object.values(convertToCanvas(i, game.getBoundaries().y)));
          for (let j = 0; j <= game.getBoundaries().y; j++)
            drawLine(context, ...Object.values(convertToCanvas(0, j)), ...Object.values(convertToCanvas(game.getBoundaries().x, j)));
        })()
      : (() => {
          // else
        })();

    controler.getCells().forEach((cell) => {
      let { x, y } = convertToCanvas(cell.x, cell.y);
      let { x: cellRadius } = convertToCanvas(cell.getRadius());
      context.drawImage(
        cell.getType() == "virus" ? virusImg : cell.getType() == "anticorps" ? anticorpsImg : cellImg,
        x - cellRadius,
        y - cellRadius,
        2 * cellRadius,
        2 * cellRadius
      );
      if (Log.getLogLevel() === Log.LEVEL_DEBUG) {
        // draw direction
        context.strokeStyle = "red";
        context.beginPath();
        context.moveTo(x, y);
        let { x: x2, y: y2 } = convertToCanvas(cell.x + cell.getDx(), cell.y + cell.getDy());
        context.lineTo(x2, y2);
        context.stroke();
      }
    });
  };

  const clearBoard = () => {
    if (Log.getLogLevel() === Log.LEVEL_DEBUG) context.clearRect(0, 0, canvas.width, canvas.height);
    else controler.getCells().forEach((cell) => clearCell(cell));
  };

  const addCell = (cellType) => {
    let cell = controler.addCell(cellType);
    cell.onInfectedChange(renderStatistics);
  };

  addCellBtn.onclick = () => addCell("cell");
  addVirusBtn.onclick = () => addCell("virus");
  addAnticorpsBtn.onclick = () => addCell("anticorps");

  controler.onNbOfBulletsChange(renderStatistics);
  controler.onScoreChange(renderStatistics);
  controler.onAddCell(renderStatistics);
  controler.onDelCell((cell) => {
    clearCell(cell);
    renderStatistics();
  });

  controler.onTimeChange(() => {
    clearBoard();
    controler.nextBoard();
    renderBoard();
  });

  canvas.onmouseover = () => Log.getLogLevel() === Log.LEVEL_DEBUG && controler.freeze();
  canvas.onmouseleave = () => Log.getLogLevel() === Log.LEVEL_DEBUG && controler.freeze(false);

  canvas.onmousedown = (e) => {
    let rect = canvas.getBoundingClientRect();
    let x = (e.clientX - rect.left) / game.getCellSize().width;
    let y = game.getBoundaries().y - (e.clientY - rect.top) / game.getCellSize().height;
    controler.click({ x, y });
  };

  return {
    startGame: controler.startGame,
  };
};
