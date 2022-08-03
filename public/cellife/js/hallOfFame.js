import { Observable } from "./utils/observable.js";
import { addStyle, sequence } from "./utils/general.js";
import { Attribute, properties as propertiesAttr } from "./utils/presentationModel.js";
import { hallOfFameProjector, pageCss as hallOfFameProjectorCss } from "./projectors/hallOfFameProjector.js";
import * as Log from './utils/log4js.js';

export { HallOfFameController, HallOfFameView, HallOfFameItemModel };

Log.setLogLevel(Log.LEVEL_ERROR);

const idSequence = sequence();

const HallOfFameItemModel = (data) => {
    const id = idSequence.next().value;

    const playerNameAttr = Attribute(data.playerName, `HoFItem.${id}.playerName`);
    playerNameAttr.getObs(propertiesAttr.NAME).setValue("playerName");
    playerNameAttr.getObs(propertiesAttr.LABEL).setValue("Player");
    const scoreAttr = Attribute(data.score, `HoFItem.${id}.score`);
    scoreAttr.getObs(propertiesAttr.NAME).setValue("score");
    scoreAttr.getObs(propertiesAttr.LABEL).setValue("Score");
    const commentAttr = Attribute(data.comment, `HoFItem.${id}.comment`);
    commentAttr.getObs(propertiesAttr.NAME).setValue("comment");
    commentAttr.getObs(propertiesAttr.LABEL).setValue("Comment");
    const createdAtAttr = Attribute(data.createdAt, `HoFItem.${id}.createdAt`);
    createdAtAttr.getObs(propertiesAttr.NAME).setValue("createdAt");
    createdAtAttr.getObs(propertiesAttr.LABEL).setValue("Date");

    return {
        id,
        playerName : playerNameAttr,
        score : scoreAttr,
        comment : commentAttr,
        createdAt : createdAtAttr,
        toString: () => `HallOfFameItemModel={id=[${id}], `+
            `${playerNameAttr.getObs(propertiesAttr.NAME).getValue()} = [${playerNameAttr.getValue()}], ` +
            `${scoreAttr.getObs(propertiesAttr.NAME).getValue()} = [${scoreAttr.getValue()}], ` +
            `${commentAttr.getObs(propertiesAttr.NAME).getValue()} = [${commentAttr.getValue()}], ` +
            `${createdAtAttr.getObs(propertiesAttr.NAME).getValue()} = [${(createdAtAttr.getValue() > 0 ? (new Date(createdAtAttr.getValue())).toLocaleDateString() : '')}], ` +
            `}`,
    }
};

const HallOfFameController = (socket, hallOfFameItemConstructor) => {
    const hallOfFame = Observable([]);

    const emitHofSubscribe = (callBack) => socket.emit('hofSubscribe', callBack);
    const emitHofReset = (callBack) => socket.emit('hofReset', callBack);
    const emitHofAddComment = (playerId, comment, callBack) => socket.emit('hofAddComment', { playerId, comment }, callBack);

    socket.on('hallOfFame', (data) => {
        Log.debug(`HallOfFameController.get('hallOfFame')=${JSON.stringify(data)}`);
        let value = [];
        data.forEach(item=>value.push(hallOfFameItemConstructor(item)));
        hallOfFame.setValue(value);
    });

    socket.on('init', () => {
        Log.debug(`HallOfFameController.get('init')`);
        emitHofSubscribe();
    });

    return {
        hallOfFame,
        hofReset: () => emitHofReset(),
        hofAddComment: emitHofAddComment,
    }
}

const HallOfFameView = (hallOfFameController, rootElt) => {
    let hallOfFameContainer = rootElt.querySelector('#wrapper-hallOfFame');

    const render = (hallOfFame) => hallOfFameProjector(hallOfFameController, hallOfFameContainer, hallOfFame);
    hallOfFameController.hallOfFame.onChange(render);
}

// main
(() => {
    addStyle('HallOfFameCss', hallOfFameProjectorCss);
})();


