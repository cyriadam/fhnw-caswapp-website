import { Observable, ObservableList } from "./utils/observable.js";
import { addStyle, sequence } from "./utils/general.js";
import * as Log from './utils/log4js.js';
import { itemProjector, pageCss as itemProjectorCss } from "./projectors/templateProjector.js";

export { ItemController, ItemView, ItemModel };

Log.setLogLevel(Log.LEVEL_DEBUG);

const idSequence = sequence();

const ItemModel = (value) => {
    const id = idSequence.next().value;

    const data = Observable(value);

    return {
        id,
        data,
        toString: () => `item{id=[${id}], data=[${data.getValue()}]}`,
    }
};

const ItemController = (itemConstructor) => {
    const listItems = ObservableList([]);

    const addItem = value => {
        Log.debug(`ItemController.addItem(${value})`);
        const item = itemConstructor(value);
        listItems.add(item);
        return item;
    };

    const delItem = item => {
        Log.debug(`ItemController.delItem(${item.toString()})`);
        return listItems.del(item);
    };

    return {
        addItem,
        delItem,
        onAddItem: listItems.onAdd,
        onDelItem: listItems.onDel,
    }
}

const ItemView = (itemController, rootElt) => {
    const render = (item) => itemController(itemController, rootElt, item);

    // binding
    itemController.onAddItem(render);
    itemController.onDelItem(render);
}

// main
(() => {
    addStyle('ItemCss', itemProjectorCss);
})();

