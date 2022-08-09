/**
 * @module projector/partyProjector
 * Projector for the PartyItemModel
 */

import { dom } from "../utils/general.js";
import { properties } from "../utils/presentationModel.js";
import * as Log from "../utils/log4js.js";

export { partyProjector, pageCss };

Log.setLogLevel(Log.LEVEL_ERROR);

const masterClassName = "party";
let partyIdSelected;                                        // Current partyId selected


/**
 * Create the dom structure of the PartyItem
 * @param  {*} partyController
 * @param  {*} item
 * @return {ChildNode}
 */
const toDoPartyItemElt = (partyController, item) => {
  let itemElt = dom(
    `<div id="PARTY-ITEM_${item.id}" class="${masterClassName}-row">` +
      // display in the selectionProjector level : `<span class="${masterClassName}-${item.createdAt.getObs(properties.NAME).getValue()}" id="${item.createdAt.getQualifier()}">${(item.createdAt.getValue() > 0 ? (new Date(item.createdAt.getValue())).toLocaleTimeString() : '')}</span>`+
      `<span class="${masterClassName}-${item.name
        .getObs(properties.NAME)
        .getValue()}" id="${item.name.getQualifier()}"><strong>${item.name.getValue()}</strong></span>` +
      `<span class="${masterClassName}-${item.nbPlayers.getObs(properties.NAME).getValue()}" id="${item.nbPlayers.getQualifier()}">${
        item.players.getValue().length
      }/${item.nbPlayers.getValue()} player(s)</span>` +
      // display in the selectionProjector level : `<span class="${masterClassName}-${item.createdBy.getObs(properties.NAME).getValue()}" id="${item.createdBy.getQualifier()}">by ${item.createdBy.getValue()}</span>`+
      `<span class="${masterClassName}-${item.status.getObs(properties.NAME).getValue()}" id="${item.status.getQualifier()}">${item.status.getValue()}</span>` +
      // display in the selectionProjector level : `<span class="${masterClassName}-${item.players.getObs(properties.NAME).getValue()}" id="${item.players.getQualifier()}">${item.players.getValue().length>0?`with ${item.players.getValue().map(player=>player.playerName).join(', ')}`:''}</span>`+
      `<span><button id="JOIN-PARTY-ITEM_${item.id}" type="button" class="btn joinPartyBtn" ${
        partyController.enable.getValue() && item.status.getValue() == "open" ? "" : 'disabled="disabled"'
      }><ion-icon class='icon' name="enter-outline"></ion-icon>Join Party</button></span>` +
      `</div>`
  );
  return itemElt;
};


/**
 * The clickHandler is set on the root container and do the binding between the GUI and the PartyItem
 * @param  {*} gameController
 */
const clickHandler = (gameController) => (e) => {
  if (e.target.type == "button" && e.target.id.match(/^JOIN-PARTY-ITEM_(.*)$/)) {
    const partyId = e.target.id.match(/^JOIN-PARTY-ITEM_(.*)$/)[1];
    gameController.joinParty(partyId);
  }
};


/**
 * The onmouseoverHandler is set on the root container and do the binding between the line selected and the PartyItem
 * @param  {*} partyController
 * @param  {*} partySelectionController
 */
const onmouseoverHandler = (partyController, partySelectionController) => (e) => {
  if (e.target.nodeName == "SPAN") {
    const partyId = e.target.closest(`.${masterClassName}-row`).id.match(/^PARTY-ITEM_(.*)$/)[1];
    if (partyIdSelected == partyId) return;

    partyIdSelected = partyId;
    const partyItem = partyController.partiesInfo.getValue().find((item) => item.id == partyId);
    partyItem ? partySelectionController.setSelectedModel(partyItem) : partySelectionController.clearSelection();
  }
};


/**
 * The partyProjector creates the party items
 * @param  {*} partyController
 * @param  {*} gameController
 * @param  {*} partySelectionController
 * @param  {HTMLElement} rootElt
 * @param  {*} partiesInfo
 */
const partyProjector = (partyController, gameController, partySelectionController, rootElt, partiesInfo) => {
  Log.debug(`partyProjector.render()`);

  let listElt = rootElt.querySelector("#parties-list");

  // inject the class for the root container and the list one
  if (!rootElt.classList.contains(`${masterClassName}`)) rootElt.classList.add(`${masterClassName}`);
  if (!listElt.classList.contains(`${masterClassName}-list`)) listElt.classList.add(`${masterClassName}-list`);

  // binding
  if (!listElt.onclick) listElt.onclick = clickHandler(gameController);
  if (!listElt.onmouseover) listElt.onmouseover = onmouseoverHandler(partyController, partySelectionController);

  // hide the partylist if it contains not element
  partiesInfo.length == 0 ? listElt.classList.add("hidden") : listElt.classList.remove("hidden");

  listElt.innerHTML = "";
  partiesInfo.forEach((item) => listElt.insertAdjacentElement("beforeend", toDoPartyItemElt(partyController, item)));
};


/**
 * The style used by the projector
 */
const pageCss = `
  .${masterClassName} {
  }

  .${masterClassName}-list::-webkit-scrollbar {
    width: 0px;
  }

  .${masterClassName}-list {
    display: grid;
    width: 100%;
    border: 1px solid var(--color-border-grey);
    border-radius: 20px;
    grid-template-columns: 3fr 1fr 1fr 170px;
    padding: 10px;
    row-gap: 5px;
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    max-height: 20vh;
    height: max-content;
    overflow-y: scroll;
    background-color: #fff;
  }

  .${masterClassName}-row {
    display: contents;
  }

  .${masterClassName}-row span {
    text-align: center;
    padding: 10px;
    border-bottom: 1px solid var(--color-border-grey);
    border-top: 1px solid var(--color-border-grey);
    display:flex;
    justify-content:center;
    align-items:center;
    height: 55px;
  }

  .${masterClassName}-row span:first-child {
    border-left: 1px solid var(--color-border-grey);
    border-top-left-radius: 20px;
    border-bottom-left-radius: 20px;
}

.${masterClassName}-row span:last-child  {
    border-right: 1px solid var(--color-border-grey);
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;
}

.${masterClassName}-row:hover span {
    background-color: #ff00000d;
    cursor: ns-resize; 
}

.${masterClassName}-status, .${masterClassName}-name {
}

span.${masterClassName}-name {
    justify-content: left;
}

span.${masterClassName}-status {
    color: #f00;
    text-transform: capitalize;
}

`;
