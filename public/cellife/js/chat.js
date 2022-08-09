/**
 * @module chat
 * Handle the chat 
 */

import { Observable, ObservableList } from "./utils/observable.js";
import { addStyle, sequence, checkFieldLength } from "./utils/general.js";
import * as Log from "./utils/log4js.js";
import { chatProjector, pageCss as chatProjectorCss } from "./projectors/chatProjector.js";

export { ChatController, ChatView, ChatItemModel };

Log.setLogLevel(Log.LEVEL_ERROR);

const idSequence = sequence();

/**
 * Create the ChatItem object
 * @param {Object} data - row values
 * @returns {Object} { id, userName(), createdAt(), emit(), text(), toString() }
 */
const ChatItemModel = (data) => {
  const id = idSequence.next().value;

  const userName = Observable(data.userName); // the creator of the message
  const createdAt = Observable(data.createdAt); // the date when the message is created
  const emit = Observable(data.emit); // if the message was emit of received
  const text = Observable(data.text); // the message itself

  return {
    id,
    userName,
    createdAt,
    emit,
    text,
    toString: () =>
      `chatItem={id=[${id}], userName=[${userName.getValue()}], createdAt=[${createdAt.getValue()}], emit=[${emit.getValue()}], text=[${text.getValue()}]}`,
  };
};

/**
 * ChatController
 * @param {Object} chatItemConstructor
 * @param {number} nbMaxItems - the numbers maximum of messages keep in the list (set to -1 if not limited)
 * @returns {Object} { addChatItem(), delChatItem(), onAddChatItem(), onDelChatItem() }
 */
const ChatController = (chatItemConstructor, nbMaxItems = -1) => {
  const listChatItems = ObservableList([]); // list of all messages

  const addChatItem = (value) => {
    Log.debug(`ChatController.addChatItem(${value})`);
    const item = chatItemConstructor(value);
    listChatItems.add(item);
    return item;
  };

  listChatItems.onAdd((item) => {
    if (listChatItems.count() > nbMaxItems) listChatItems.del(listChatItems.getList()[0]); // remove the oldest message if the limit of the list is reached
  });

  const delChatItem = (item) => {
    Log.debug(`ChatController.delItem(${delChatItem.toString()})`);
    return listChatItems.del(item);
  };

  return {
    addChatItem,
    delChatItem,
    onAddChatItem: listChatItems.onAdd,
    onDelChatItem: listChatItems.onDel,
  };
};

/**
 * ChatView
 * @param {Object} chatController 
 * @param {Object} dataPoolController 
 * @param {Object} gameController 
 * @param {HTMLElement} rootElt 
 */
const ChatView = (chatController, dataPoolController, gameController, rootElt) => {
  let userNameElt = rootElt.querySelector("#username");
  let chatMsgElt = rootElt.querySelector("#chatMsg");
  let chatRoomElt = rootElt.querySelector("#chatRoom");

  const render = (item) => chatProjector(chatController, chatRoomElt, item);

  // binding
  chatController.onAddChatItem(render);

  chatController.onDelChatItem((item) => {
    Log.debug(`delete chatItem(id=[${item.id}])`);
    let target = chatRoomElt.querySelector(`#CHAT-ITEM_${item.id}`);
    target.remove();
  });

  // binding between the dataPoolController and the chatController : server -> client
  dataPoolController.getObsIn("chatMsg").onChange((val) => {
    if (val == undefined || /^\s*$/.test(val)) return;  // secure : empty message are ignored
    const data = JSON.parse(val);
    chatController.addChatItem({ ...data, emit: data.userName == gameController.getUserName() });
  });

  // binding between the GUI and the dataPoolController : client -> server
  chatMsgElt.onchange = (e) => {
    if (e.target.value == undefined || /^\s*$/.test(e.target.value)) return;    // empty message are ignored
    if ([checkFieldLength(userNameElt, 5)].some((r) => !r)) return;             // at least 5 char length, note : the checkFieldLength render the error message
    dataPoolController
      .getObsOut("chatMsg")
      .setValue(JSON.stringify({ userName: gameController.getUserName(), createdAt: new Date().getTime(), text: e.target.value }));
    e.target.value = "";
  };
};

// main : inject the style used by the projector
(() => {
  addStyle("ChatCss", chatProjectorCss);
})();
