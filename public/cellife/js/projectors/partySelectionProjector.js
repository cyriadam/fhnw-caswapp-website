/**
 * @module projector/partySelectionProjector
 * Projector for the PartyItemModel selected
 */

import { dom } from "../utils/general.js";
import { properties } from "../utils/presentationModel.js";
import { NoPartyItem } from "../party.js";
import * as Log from "../utils/log4js.js";

export { partySelectionProjector, pageCss };

Log.setLogLevel(Log.LEVEL_ERROR);

const masterClassName = "partySelection";

/**
 * Create the dom structure of the PartyItem
 * @param  {*} item
 * @return {ChildNode}
 */
const toDoPartySelectionElt = (item) => {
  let itemElt = dom(
    `<div>` +
      `<label><strong>${item.name.getObs(properties.LABEL).getValue()}</label></strong><span class="${masterClassName}-${item.name
        .getObs(properties.NAME)
        .getValue()}"><strong>${item.name.getValue()}</strong></span>` +
      `<label><strong>${item.createdAt.getObs(properties.LABEL).getValue()}</strong></label><span class="${masterClassName}-${item.createdAt
        .getObs(properties.NAME)
        .getValue()}">${item.createdAt.getValue() > 0 ? new Date(item.createdAt.getValue()).toLocaleString() : ""}</span>` +
      `<label><strong>${item.createdBy.getObs(properties.LABEL).getValue()}</strong></label><span class="${masterClassName}-${item.createdBy
        .getObs(properties.NAME)
        .getValue()}">${item.createdBy.getValue()}</span>` +
      `<label><strong>${item.nbPlayers.getObs(properties.LABEL).getValue()}</strong></label><span class="${masterClassName}-${item.nbPlayers
        .getObs(properties.NAME)
        .getValue()}">${item.nbPlayers.getValue()}</span>` +
      `<label><strong>${item.status.getObs(properties.LABEL).getValue()}</strong></label><span class="${masterClassName}-${item.status
        .getObs(properties.NAME)
        .getValue()}">${item.status.getValue()}</span>` +
      `<label><strong>${item.players.getObs(properties.LABEL).getValue()}</strong></label><span class="${masterClassName}-${item.players
        .getObs(properties.NAME)
        .getValue()}">${
        item.players.getValue().length > 0
          ? `${item.players
              .getValue()
              .map((player) => player.playerName)
              .join(", ")}`
          : ""
      }</span>` +
      `</div>`
  );
  return itemElt;
};

/**
 * The partySelectionProjector creates the party detail item
 * @param  {*} partySelectionController
 * @param  {HTMLElement} rootElt
 * @param  {*} partyItem
 */
const partySelectionProjector = (partySelectionController, rootElt, partyItem) => {
  Log.debug(`partySelectionProjector.render(${partyItem.toString()})`);

  if (!rootElt.classList.contains(`${masterClassName}`)) rootElt.classList.add(`${masterClassName}`);

  rootElt.innerHTML = "";
  // different render for NoPartyItem and a partyItem
  if (partyItem == NoPartyItem) rootElt.insertAdjacentElement("beforeend", dom(`<span class='noSelection'>No Party Information</span>`));
  else Array.from(toDoPartySelectionElt(partyItem).children).forEach((childElt) => rootElt.insertAdjacentElement("beforeend", childElt));
};

/**
 * The style used by the projector
 */
const pageCss = `
  .${masterClassName} {
    border: 1px solid var(--color-border-grey);
    border-radius: 20px;
    padding: 20px;
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
  }

  .${masterClassName} label {
    background-color: #ff00000d;
    width: 100%;
    padding-left: 10px;
    border-left: 1px solid var(--color-border-grey);
    border-right: 1px solid var(--color-border-grey);
  }

  .${masterClassName} label:first-of-type {
    border-left: 1px solid var(--color-border-grey);
    border-top-left-radius: 20px;
    border-top: 1px solid var(--color-border-grey);
    padding-top: 10px;
  }

  .${masterClassName} label:last-of-type  {
    border-left: 1px solid var(--color-border-grey);
    border-bottom-left-radius: 20px;
    border-bottom: 1px solid var(--color-border-grey);
    padding-bottom: 10px;
  }

  .${masterClassName} span {
    text-transform: capitalize;
  }

  .${masterClassName} span.noSelection {
    grid-column: 1 / 2 span;
    width: 100%;
    text-align: center;
  }
`;
