import { Observable } from "./utils/observable.js";
import { addStyle, sequence } from "./utils/general.js";
import { Attribute, properties as propertiesAttr } from "./utils/presentationModel.js";
import { partyProjector, pageCss as partyProjectorCss } from "./projectors/partyProjector.js";
import { partySelectionProjector, pageCss as partySelectionProjectorCss } from "./projectors/partySelectionProjector.js";
import * as Log from './utils/log4js.js';

export { PartyController, PartyView, PartyItemModel, NoPartyItem }

Log.setLogLevel(Log.LEVEL_ERROR);

const idSequence = sequence();

const PartyItemModel = (data) => {
    const id = (data.id!=undefined)?data.id:idSequence.next().value;
    const nameAttr = Attribute(data.name||'', `PartyItem.${id}.name`);
    nameAttr.getObs(propertiesAttr.NAME).setValue("name");
    nameAttr.getObs(propertiesAttr.LABEL).setValue("Name");
    const nbPlayersAttr = Attribute(data.nbPlayers||'', `PartyItem.${id}.nbPlayers`);
    nbPlayersAttr.getObs(propertiesAttr.NAME).setValue("nbPlayers");
    nbPlayersAttr.getObs(propertiesAttr.LABEL).setValue("Nb Player(s)");
    const createdByAttr = Attribute(data.createdBy||'', `PartyItem.${id}.createdBy`);
    createdByAttr.getObs(propertiesAttr.NAME).setValue("createdBy");
    createdByAttr.getObs(propertiesAttr.LABEL).setValue("Owner");
    const createdAtAttr = Attribute(data.createdAt||0, `PartyItem.${id}.createdAt`);
    createdAtAttr.getObs(propertiesAttr.NAME).setValue("createdAt");
    createdAtAttr.getObs(propertiesAttr.LABEL).setValue("Date");
    const statusAttr = Attribute(data.status||'', `PartyItem.${id}.status`);
    statusAttr.getObs(propertiesAttr.NAME).setValue("status");
    statusAttr.getObs(propertiesAttr.LABEL).setValue("Status");
    const playersAttr = Attribute(data.players||[], `PartyItem.${id}.players`);
    playersAttr.getObs(propertiesAttr.NAME).setValue("players");
    playersAttr.getObs(propertiesAttr.LABEL).setValue("Players");

    return {
        id,
        name : nameAttr,
        nbPlayers : nbPlayersAttr,
        createdBy : createdByAttr,
        createdAt : createdAtAttr,
        status : statusAttr,
        players : playersAttr,
        toString: () => `PartyItemModel={id=[${id}], `+
            `${nameAttr.getObs(propertiesAttr.NAME).getValue()} = [${nameAttr.getValue()}], ` +
            `${nbPlayersAttr.getObs(propertiesAttr.NAME).getValue()} = [${nbPlayersAttr.getValue()}], ` +
            `${createdByAttr.getObs(propertiesAttr.NAME).getValue()} = [${createdByAttr.getValue()}], ` +
            `${createdAtAttr.getObs(propertiesAttr.NAME).getValue()} = [${(createdAtAttr.getValue() > 0 ? (new Date(createdAtAttr.getValue())).toLocaleDateString() : '')}], ` +
            `${statusAttr.getObs(propertiesAttr.NAME).getValue()} = [${statusAttr.getValue()}], ` +
            `${playersAttr.getObs(propertiesAttr.NAME).getValue()} = [${playersAttr.getValue().join(', ')}], ` +
            `}`,
    }
};

const PartyController = (socket, partyItemConstructor) => {
    const partyTimeOut = Observable(false);
    const partyLocked = Observable(false);

    const enable = Observable(true);
    const partiesInfo = Observable([]);

    const emitPartiesInfoSubscribe = (callBack) => socket.emit('partiesInfoSubscribe', callBack);
    const emitNewParty = (nbPlayers, partyName, playerName, callBack) => socket.emit('newParty', {nbPlayers, partyName, playerName}, callBack);
    const emitJoinParty = (partyId, playerName, callBack) => socket.emit('joinParty', {partyId, playerName}, callBack);
    const emitLeaveParty = (callBack) => socket.emit('leaveParty', callBack); 

    socket.on('partiesInfo', (data) => {
        Log.debug(`PartyController.get('partiesInfo')=${JSON.stringify(data)}`);
        let value = [];
        data.forEach(item=>value.push(partyItemConstructor(item)));
        partiesInfo.setValue(value);
    });

    socket.on('partyTimeOut', (partyId) => {
        Log.debug(`PartyController.get('partyTimeOut(partyId=[${partyId}])')`);
        partyTimeOut.setValue(true);
    });

    socket.on('partyLocked', (partyId) => {
        Log.debug(`PartyController.get('partyLocked(partyId=[${partyId}])')`);
        partyLocked.setValue(true);
    });

    const newParty = (nbPlayers, partyName, playerName, callBack) => {
        partyTimeOut.setValue(false);
        partyLocked.setValue(false);
        emitNewParty(nbPlayers, partyName, playerName, callBack);
    }

    socket.on('init', () => {
        Log.debug(`PartyController.get('init')`);
        emitPartiesInfoSubscribe();
    });

    return {
        enable,
        partiesInfo,
        newParty,
        joinParty : emitJoinParty,
        leaveParty : emitLeaveParty,
        partyTimeOut,
        partyLocked,
    }
}


const PartyView = (partyController, gameController, partySelectionController, rootElt) => {
    let partiesInfoContainer=rootElt.querySelector('#wrapper-parties');
    let partyDetailContainer=rootElt.querySelector('#party-detail');

    const render = (partiesInfo) => partyProjector(partyController, gameController, partySelectionController, partiesInfoContainer, partiesInfo);
    partyController.partiesInfo.onChange(render);

    const renderSelection = (partyItem) => partySelectionProjector(partySelectionController, partyDetailContainer, partyItem);
    partySelectionController.onModelSelected(renderSelection);
    partyController.partiesInfo.onChange(partiesInfo=>{
        const partyId=partySelectionController.getSelectedModel().id;
        const partyItem=partyController.partiesInfo.getValue().find(item=>item.id==partyId);
        (partyItem)?partySelectionController.setSelectedModel(partyItem):partySelectionController.clearSelection();
    });

    const joinPartyBtnsEnable = (enable) => rootElt.querySelectorAll('button.joinPartyBtn').forEach(elt=> enable?elt.removeAttribute('disabled'):elt.setAttribute('disabled', 'disabled')); 
    partyController.enable.onChange(joinPartyBtnsEnable);
}

const NoPartyItem = PartyItemModel({id:-1});

  // main
(() => {
    addStyle('PartyCss', partyProjectorCss);
    addStyle('PartySelectionCss', partySelectionProjectorCss);
})();


