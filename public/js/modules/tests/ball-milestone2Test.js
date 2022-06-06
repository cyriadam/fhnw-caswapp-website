import { tat } from "../test.js";
import {pair, pairEquals, snd, fst} from "../lambda.js";
import { GameControler, GameView, Game } from "../ball-milestone2.js";

export {tatResults}

let tatResults=tat('Module Balls milestone2 / test-cases-1', (assert) => {

  let gameControler=GameControler();
  const game = Game(40, 20, 400, 200);
  gameControler.init(game);
  let ball = gameControler.createBall(1);

  // ball moving
  ball = { ...ball, coord: { x: 10, y: 10 }, delta: { x: 0, y: 0 } };
  let ballCordBefore = pair(ball.coord.x)(ball.coord.y);
  // console.log(JSON.stringify(ball));
  gameControler.nextBoard(ball);
  // console.log(JSON.stringify(ball));
  let ballCordAfter = pair(ball.coord.x)(ball.coord.y);
  assert.equals(pairEquals(ballCordBefore)(ballCordAfter), false);

  // ball hurts bottom
  ball = { ...ball, coord: { x: 10, y: 0 }, delta: { x: 0, y: -1 } };
  let ballDeltaBefore = pair(ball.delta.x)(ball.delta.y);
  // console.log(JSON.stringify(ball));
  gameControler.nextBoard(ball);
  // console.log(JSON.stringify(ball));
  let ballDeltaAfter = pair(ball.delta.x)(ball.delta.y);
  assert.equals(snd(ballDeltaBefore) < 0 && snd(ballDeltaAfter) > 0, true);

  // ball hurts right boundary
  ball = { ...ball, coord: { x: game.getBoundaries().x, y: 0 }, delta: { x: 1, y: 0 } };
  ballDeltaBefore = pair(ball.delta.x)(ball.delta.y);
  // console.log(JSON.stringify(ball));
  gameControler.nextBoard(ball);
  // console.log(JSON.stringify(ball));
  ballDeltaAfter = pair(ball.delta.x)(ball.delta.y);
  assert.equals(fst(ballDeltaBefore) > 0 && fst(ballDeltaAfter) < 0, true);

  // ball hurts left boundary
  ball = { ...ball, coord: { x: 0, y: 0 }, delta: { x: -1, y: 0 } };
  ballDeltaBefore = pair(ball.delta.x)(ball.delta.y);
  // console.log(JSON.stringify(ball));
  gameControler.nextBoard(ball);
  // console.log(JSON.stringify(ball));
  ballDeltaAfter = pair(ball.delta.x)(ball.delta.y);
  assert.equals(fst(ballDeltaBefore) < 0 && fst(ballDeltaAfter) > 0, true);

}, true);
