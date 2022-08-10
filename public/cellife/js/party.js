/**
 * @module party
 * handle the administration of a party (creation, join, leave) and the subscription to the list of available parties
 */

import { Observable } from "./utils/observable.js";
import { addStyle, sequence } from "./utils/general.js";
import { Attribute, properties as propertiesAttr } from "./utils/presentationModel.js";
import { partyProjector, pageCss as partyProjectorCss } from "./projectors/partyProjector.js";
import { partySelectionProjector, pageCss as partySelectionProjectorCss } from "./projectors/partySelectionProjector.js";
import * as Log from "./utils/log4js.js";

export { PartyController, PartyView, PartyItemModel, NoPartyItem };

Log.setLogLevel(Log.LEVEL_ERROR);

const idSequence = sequence();

/**
 * Create the PartyItem object 
 * 
 * Note: the HallOfFameItem object has following properties :
 * - id : local uid
 * - name : name of the party
 * - nbPlayers : nb of players 
 * - createdBy : the creator of the party 
 * - createdAt : the date when the party is created
 * - status : the status of the party ( 'open' when the party accepts new player(s), 'closed' when the all payers have joined the party ) 
 * - players : the list of players which join the party
 * @param {Object} data - row values
 * @returns {Object} { id, name(), nbPlayers(), createdBy(), createdAt(), status(), players(), toString() }
 */
const PartyItemModel = (data) => {
  const id = data.id != undefined ? data.id : idSequence.next().value;
  const nameAttr = Attribute(data.name || "", `PartyItem.${id}.name`);
  nameAttr.getObs(propertiesAttr.NAME).setValue("name");
  nameAttr.getObs(propertiesAttr.LABEL).setValue("Name");
  const nbPlayersAttr = Attribute(data.nbPlayers || "", `PartyItem.${id}.nbPlayers`);
  nbPlayersAttr.getObs(propertiesAttr.NAME).setValue("nbPlayers");
  nbPlayersAttr.getObs(propertiesAttr.LABEL).setValue("Nb Player(s)");
  const createdByAttr = Attribute(data.createdBy || "", `PartyItem.${id}.createdBy`);
  createdByAttr.getObs(propertiesAttr.NAME).setValue("createdBy");
  createdByAttr.getObs(propertiesAttr.LABEL).setValue("Owner");
  const createdAtAttr = Attribute(data.createdAt || 0, `PartyItem.${id}.createdAt`);
  createdAtAttr.getObs(propertiesAttr.NAME).setValue("createdAt");
  createdAtAttr.getObs(propertiesAttr.LABEL).setValue("Date");
  const statusAttr = Attribute(data.status || "", `PartyItem.${id}.status`);
  statusAttr.getObs(propertiesAttr.NAME).setValue("status");
  statusAttr.getObs(propertiesAttr.LABEL).setValue("Status");
  const playersAttr = Attribute(data.players || [], `PartyItem.${id}.players`);
  playersAttr.getObs(propertiesAttr.NAME).setValue("players");
  playersAttr.getObs(propertiesAttr.LABEL).setValue("Players");

  return {
    id,
    name: nameAttr,
    nbPlayers: nbPlayersAttr,
    createdBy: createdByAttr,
    createdAt: createdAtAttr,
    status: statusAttr,
    players: playersAttr,
    toString: () =>
      `PartyItemModel={id=[${id}], ` +
      `${nameAttr.getObs(propertiesAttr.NAME).getValue()} = [${nameAttr.getValue()}], ` +
      `${nbPlayersAttr.getObs(propertiesAttr.NAME).getValue()} = [${nbPlayersAttr.getValue()}], ` +
      `${createdByAttr.getObs(propertiesAttr.NAME).getValue()} = [${createdByAttr.getValue()}], ` +
      `${createdAtAttr.getObs(propertiesAttr.NAME).getValue()} = [${
        createdAtAttr.getValue() > 0 ? new Date(createdAtAttr.getValue()).toLocaleDateString() : ""
      }], ` +
      `${statusAttr.getObs(propertiesAttr.NAME).getValue()} = [${statusAttr.getValue()}], ` +
      `${playersAttr.getObs(propertiesAttr.NAME).getValue()} = [${playersAttr.getValue().join(", ")}], ` +
      `}`,
  };
};


/**
 * PartyController
 * 
 * Note : services are following 
 * - enable : enable or disable the possibility to join a party (when the user join a party, when the game has not yet started or is running)
 * - partiesInfo : list of all parties
 * - newParty : create a new party & automatically join it
 * - joinParty : join a party 
 * - leaveParty : leave the current party
 * - partyTimeOut : on partyTimeOut notification the game state is set to 'cancel'
 * - partyLocked : on partyTimeOut notification the game state is set to 'locked'
 * 
 * @param {*} socket 
 * @param {*} partyItemConstructor 
 * @returns {Object} { enable(), partiesInfo(), newParty(), joinParty(), leaveParty(), partyTimeOut(), partyLocked() }
 */
const PartyController = (socket, partyItemConstructor) => {
  const partyTimeOut = Observable(false);   // true when the party falls on timeout
  const partyLocked = Observable(false);    // true when all players joined the party and the game will start soon

  const enable = Observable(true);          // if true, the user can not join another party (buttons are diseable)
  const partiesInfo = Observable([]);       // list of all parties

  // emit methods
  const emitPartiesInfoSubscribe = (callBack) => socket.emit("partiesInfoSubscribe", callBack);
  const emitNewParty = (nbPlayers, partyName, playerName, callBack) => socket.emit("newParty", { nbPlayers, partyName, playerName }, callBack);
  const emitJoinParty = (partyId, playerName, callBack) => socket.emit("joinParty", { partyId, playerName }, callBack);
  const emitLeaveParty = (callBack) => socket.emit("leaveParty", callBack);

  socket.on("partiesInfo", (data) => {
    Log.debug(`PartyController.get('partiesInfo')=${JSON.stringify(data)}`);
    let value = [];
    data.forEach((item) => value.push(partyItemConstructor(item)));
    partiesInfo.setValue(value);
  });

  socket.on("partyTimeOut", (partyId) => {
    Log.debug(`PartyController.get('partyTimeOut(partyId=[${partyId}])')`);
    partyTimeOut.setValue(true);
  });

  socket.on("partyLocked", (partyId) => {
    Log.debug(`PartyController.get('partyLocked(partyId=[${partyId}])')`);
    partyLocked.setValue(true);
  });

  const newParty = (nbPlayers, partyName, playerName, callBack) => {
    partyTimeOut.setValue(false);
    partyLocked.setValue(false);
    emitNewParty(nbPlayers, partyName, playerName, callBack);
  };

  socket.on("init", () => {
    Log.debug(`PartyController.get('init')`);
    emitPartiesInfoSubscribe();
  });

  return {
    enable,
    partiesInfo,
    newParty,
    joinParty: emitJoinParty,
    leaveParty: emitLeaveParty,
    partyTimeOut,
    partyLocked,
  };
};

/**
 * PartyView
 * @param {Object} partyController 
 * @param {Object} gameController - master
 * @param {Object} partySelectionController - detail
 * @param {HTMLElement} rootElt 
 */
const PartyView = (partyController, gameController, partySelectionController, rootElt) => {
  let partiesInfoContainer = rootElt.querySelector("#wrapper-parties");
  let partyDetailContainer = rootElt.querySelector("#party-detail");

  // master
  const render = (partiesInfo) => partyProjector(partyController, gameController, partySelectionController, partiesInfoContainer, partiesInfo);
  partyController.partiesInfo.onChange(render);

  // detail
  const renderSelection = (partyItem) => partySelectionProjector(partySelectionController, partyDetailContainer, partyItem);
  partySelectionController.onModelSelected(renderSelection);
  // clear the selection of epired items
  partyController.partiesInfo.onChange((partiesInfo) => {
    const partyId = partySelectionController.getSelectedModel().id;
    const partyItem = partyController.partiesInfo.getValue().find((item) => item.id == partyId);
    partyItem ? partySelectionController.setSelectedModel(partyItem) : partySelectionController.clearSelection();
  });

  // enable/diseable buttons to join a party
  const joinPartyBtnsEnable = (enable) => rootElt.querySelectorAll("button.joinPartyBtn").forEach((elt) => (enable ? elt.removeAttribute("disabled") : elt.setAttribute("disabled", "disabled")));
  partyController.enable.onChange(joinPartyBtnsEnable);
};

// singleton : creation of a 'NoPartyItem'
const NoPartyItem = PartyItemModel({ id: -1 });

// main : inject the style used by the projectors
(() => {
  addStyle("PartyCss", partyProjectorCss);
  addStyle("PartySelectionCss", partySelectionProjectorCss);
})();
