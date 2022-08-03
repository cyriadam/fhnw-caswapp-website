
import { dom } from '../utils/general.js';
import { properties } from '../utils/presentationModel.js';
import * as Log from '../utils/log4js.js';

export { partyProjector, pageCss }

Log.setLogLevel(Log.LEVEL_ERROR);

const masterClassName = 'party';

const toDoPartyItemElt = (partyController, item) => {

    let itemElt = dom(`<div id="PARTY-ITEM_${item.id}" class="${masterClassName}-row">`+
        // `<span class="${masterClassName}-${item.createdAt.getObs(properties.NAME).getValue()}" id="${item.createdAt.getQualifier()}">${(item.createdAt.getValue() > 0 ? (new Date(item.createdAt.getValue())).toLocaleTimeString() : '')}</span>`+
        `<span class="${masterClassName}-${item.name.getObs(properties.NAME).getValue()}" id="${item.name.getQualifier()}"><strong>${item.name.getValue()}</strong></span>`+
        `<span class="${masterClassName}-${item.nbPlayers.getObs(properties.NAME).getValue()}" id="${item.nbPlayers.getQualifier()}">${item.players.getValue().length}/${item.nbPlayers.getValue()} player(s)</span>`+
        // `<span class="${masterClassName}-${item.createdBy.getObs(properties.NAME).getValue()}" id="${item.createdBy.getQualifier()}">by ${item.createdBy.getValue()}</span>`+
        `<span class="${masterClassName}-${item.status.getObs(properties.NAME).getValue()}" id="${item.status.getQualifier()}">${item.status.getValue()}</span>`+
        // `<span class="${masterClassName}-${item.players.getObs(properties.NAME).getValue()}" id="${item.players.getQualifier()}">${item.players.getValue().length>0?`with ${item.players.getValue().map(player=>player.playerName).join(', ')}`:''}</span>`+
        `<span><button id="JOIN-PARTY-ITEM_${item.id}" type="button" class="btn joinPartyBtn" ${(partyController.enable.getValue()&&item.status.getValue()=='open')?'':'disabled="disabled"'}><ion-icon class='icon' name="enter-outline"></ion-icon>Join Party</button></span>`+
        `</div>`);
    return itemElt;
}

const clickHandler = (partyController, gameController, partySelectionController) => (e => {
    if(e.target.type=='button'&&e.target.id.match(/^JOIN-PARTY-ITEM_(.*)$/)) {
        const partyId = e.target.id.match(/^JOIN-PARTY-ITEM_(.*)$/)[1];
        gameController.joinParty(partyId);
    } 
})

let partyIdSelected;
const onmouseoverHandler = (partyController, gameController, partySelectionController) => (e => {
    if(e.target.nodeName=='SPAN') {
        const partyId = e.target.closest(`.${masterClassName}-row`).id.match(/^PARTY-ITEM_(.*)$/)[1];
        if(partyIdSelected==partyId) return;

        partyIdSelected=partyId;
        const partyItem = partyController.partiesInfo.getValue().find(item=>item.id==partyId);
        (partyItem)?partySelectionController.setSelectedModel(partyItem):partySelectionController.clearSelection();
    }
})

const partyProjector = (partyController, gameController, partySelectionController, rootElt, partiesInfo) => {
    Log.debug(`partyProjector.render()`);

    let listElt= rootElt.querySelector('#parties-list');

    if (!rootElt.classList.contains(`${masterClassName}`)) rootElt.classList.add(`${masterClassName}`);
    if (!listElt.classList.contains(`${masterClassName}-list`)) listElt.classList.add(`${masterClassName}-list`);
    if(!listElt.onclick) listElt.onclick=clickHandler(partyController, gameController, partySelectionController);
    if(!listElt.onmouseover) listElt.onmouseover=onmouseoverHandler(partyController, gameController, partySelectionController);

    (partiesInfo.length==0)?listElt.classList.add('hidden'):listElt.classList.remove('hidden');

    listElt.innerHTML = '';
    partiesInfo.forEach(item => listElt.insertAdjacentElement('beforeend', toDoPartyItemElt(partyController, item)));
};

const pageCss = `
  .${masterClassName} {
  }

  .${masterClassName}-list::-webkit-scrollbar {
    width: 0px;
  }

  .${masterClassName}-list {
    display: grid;
    width: 100%;
    border: 1px solid #c7c7c7;
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
    border-bottom: 1px solid #c7c7c7;
    border-top: 1px solid #c7c7c7;
    display:flex;
    justify-content:center;
    align-items:center;
    height: 55px;
  }

  .${masterClassName}-row span:first-child {
    border-left: 1px solid #c7c7c7;
    border-top-left-radius: 20px;
    border-bottom-left-radius: 20px;
}

.${masterClassName}-row span:last-child  {
    border-right: 1px solid #c7c7c7;
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
