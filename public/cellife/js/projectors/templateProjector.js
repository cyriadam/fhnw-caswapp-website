import { dom, random } from "../utils/general.js";
import * as Log from "../utils/log4js.js";

export { itemProjector, pageCss };

Log.setLogLevel(Log.LEVEL_DEBUG);

const masterClassName = "item";

const toDoItemElt = (itemController, rootElt, item) => {
  let itemElt = dom(`<div class="${masterClassName} id="ITEM_${item.id}">${item.data.getValue()}</div>`);

  // -- binding GUI -> Model
  itemElt.onClick = (evt) => {
    item.data.setValue(`[${random(100)}]`);
  };

  // -- binding Model -> GUI
  item.data.onChange((value, oldValue) => {
    Log.debug(`item{id=[${item.id}]} changed : data=[${oldValue}]=>[${value}]`);
    let target = rootElt.querySelector(`#ITEM_${item.id}`);
    target.innerHTML = value;
  });

  return itemElt;
};

const itemProjector = (itemController, rootElt, item) => {
  Log.debug(`itemProjector.render(${item.toString()})`);
  let itemElt = toDoItemElt(itemController, rootElt, item);
  rootElt.insertAdjacentElement("beforeend", itemElt);
};

const pageCss = `
  .${masterClassName} {
    color: red;
  }
`;
