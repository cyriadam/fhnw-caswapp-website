import { Observable, ObservableList } from "./utils/observable.js";
import { addStyle, sequence, checkFieldLength } from "./utils/general.js";
import * as Log from "./utils/log4js.js";
import { chatProjector, pageCss as chatProjectorCss } from "./projectors/chatProjector.js";

export { ChatController, ChatView, ChatItemModel };

Log.setLogLevel(Log.LEVEL_ERROR);

const idSequence = sequence();

const ChatItemModel = (data) => {
  const id = idSequence.next().value;

  const userName = Observable(data.userName);
  const createdAt = Observable(data.createdAt);
  const emit = Observable(data.emit);
  const text = Observable(data.text);

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

const ChatController = (chatItemConstructor, nbMaxItems = -1) => {
  const listChatItems = ObservableList([]);

  const addChatItem = (value) => {
    Log.debug(`ChatController.addChatItem(${value})`);
    const item = chatItemConstructor(value);
    listChatItems.add(item);
    return item;
  };

  listChatItems.onAdd((item) => {
    if (listChatItems.count() > nbMaxItems) listChatItems.del(listChatItems.getList()[0]);
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

  dataPoolController.getObsIn("chatMsg").onChange((val) => {
    if (val == undefined || /^\s*$/.test(val)) return;
    const data = JSON.parse(val);
    chatController.addChatItem({ ...data, emit: data.userName == gameController.getUserName() });
  });

  chatMsgElt.onchange = (e) => {
    if (e.target.value == undefined || /^\s*$/.test(e.target.value)) return;
    if ([checkFieldLength(userNameElt, 5)].some((r) => !r)) return;
    dataPoolController
      .getObsOut("chatMsg")
      .setValue(JSON.stringify({ userName: gameController.getUserName(), createdAt: new Date().getTime(), text: e.target.value }));
    e.target.value = "";
  };
};

// main
(() => {
  addStyle("ChatCss", chatProjectorCss);
})();
