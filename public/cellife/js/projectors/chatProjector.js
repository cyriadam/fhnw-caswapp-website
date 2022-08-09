/**
 * @module projector/chatProjector
 * Projector for the ChatItemModel 
 */

import { dom } from "../utils/general.js";
import * as Log from "../utils/log4js.js";

export { chatProjector, pageCss };

Log.setLogLevel(Log.LEVEL_ERROR);

const masterClassName = "chat";

/**
 * Create the dom structure of a chat message
 * @param  {Object} item
 * @return {ChildNode}
 */
const toDoChatItemElt = (item) => {
  let itemElt = dom(
    `<div class="${masterClassName} ${item.emit.getValue() ? "right" : "left"}" id="CHAT-ITEM_${item.id}">` +
      (item.emit.getValue()
        ? `<p>${item.text.getValue()}</p>`
        : `<p><strong>${item.emit.getValue() ? "" : item.userName.getValue().toUpperCase()}</strong> : "${item.text.getValue()}"</p>`) +
      `<p class="text-note">${new Date(item.createdAt.getValue()).toLocaleTimeString()}</p>` +
      `</div>`
  );

  return itemElt;
};

/**
 * The chatController add the dom structure of a chat message in the dom
 * @param  {Object} chatController
 * @param  {HTMLElement} rootElt
 * @param  {Object} item
 */
const chatProjector = (chatController, rootElt, item) => {
  Log.debug(`chatProjector.render(${item.toString()})`);
  let itemElt = toDoChatItemElt(item);
  rootElt.insertAdjacentElement("beforeend", itemElt);
  rootElt.scrollTop = rootElt.scrollHeight;     // point of interest : scroll to the end
};

/**
 * The style used by the projector
 */
const pageCss = `
  .${masterClassName} {
    padding: 10px 10px 5px 10px;
    border: 1px solid var(--color-border-grey);
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
