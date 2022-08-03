
import { dom } from '../utils/general.js';
import * as Log from '../utils/log4js.js';

export { chatProjector, pageCss }

Log.setLogLevel(Log.LEVEL_ERROR);

const masterClassName = 'chat';

const toDoChatItemElt = (chatController, rootElt, item) => {

    let itemElt = dom(
        `<div class="${masterClassName} ${item.emit.getValue()?'right':'left'}" id="CHAT-ITEM_${item.id}">`+
        (item.emit.getValue()?`<p>${item.text.getValue()}</p>`:`<p><strong>${item.emit.getValue()?'':item.userName.getValue().toUpperCase()}</strong> : "${item.text.getValue()}"</p>`)+
        `<p class="text-note">${new Date(item.createdAt.getValue()).toLocaleTimeString()}</p>`+
        `</div>`);

    return itemElt;
}

const chatProjector = (chatController, rootElt, item) => {
    Log.debug(`chatProjector.render(${item.toString()})`);
    let itemElt = toDoChatItemElt(chatController, rootElt, item);
    rootElt.insertAdjacentElement('beforeend', itemElt);
    rootElt.scrollTop = rootElt.scrollHeight;
};

const pageCss = `
  .${masterClassName} {
    padding: 10px 10px 5px 10px;
    border: 1px solid #c7c7c7;
    margin-bottom: 8px;
    width: fit-content;
  }

  .${masterClassName}.left {
    background-color: #ff00000d;
    border-radius: 0px 20px 20px 0px;
    margin-right: 10%;
    align-self: flex-start;
    text-align: left;
  }

  .${masterClassName}.right {
    background-color: #ff000087;
    border-radius: 20px 0px 0px 20px;
    margin-left: 10%;
    align-self: flex-end;
    color: #fff;
    text-align: right;
  }
`;


