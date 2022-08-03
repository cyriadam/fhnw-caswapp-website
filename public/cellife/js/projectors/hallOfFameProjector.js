import { dom } from "../utils/general.js";
import { properties } from "../utils/presentationModel.js";
import * as Log from "../utils/log4js.js";

export { hallOfFameProjector, pageCss };

Log.setLogLevel(Log.LEVEL_ERROR);

const masterClassName = "hallOfFame";

const toDoHallOfFameHeaderElt = (item) => {
  // return dom(`<div>`+ATTRIBUTE_NAMES.map(attrName => `<span class="${masterClassName}-label">${item[0][attrName].getObs(properties.LABEL).getValue()}</span>`).join('')+`</div>`);
  let itemElt = dom(
    `<div class="${masterClassName}-label">` +
      `<span>${item[0].playerName.getObs(properties.LABEL).getValue()}</span>` +
      `<span>${item[0].score.getObs(properties.LABEL).getValue()}</span>` +
      `<span>${item[0].comment.getObs(properties.LABEL).getValue()}</span>` +
      `<span>${item[0].createdAt.getObs(properties.LABEL).getValue()}</span>` +
      `</div>`
  );
  return itemElt;
};

const toDoHallOfFameElt = (item) => {
  let itemElt = dom(
    `<div class="${masterClassName}-row">` +
      `<span class="${masterClassName}-${item.playerName
        .getObs(properties.NAME)
        .getValue()}" id="${item.playerName.getQualifier()}">${item.playerName.getValue()}</span>` +
      `<span class="${masterClassName}-${item.score.getObs(properties.NAME).getValue()}" id="${item.score.getQualifier()}">${item.score.getValue()}</span>` +
      `<span class="${masterClassName}-${item.comment
        .getObs(properties.NAME)
        .getValue()}" id="${item.comment.getQualifier()}">${item.comment.getValue()}</span>` +
      `<span class="${masterClassName}-${item.createdAt.getObs(properties.NAME).getValue()}" id="${item.createdAt.getQualifier()}">${
        item.createdAt.getValue() > 0 ? new Date(item.createdAt.getValue()).toLocaleDateString() : ""
      }</span>` +
      `</div>`
  );
  return itemElt;
};

const hallOfFameProjector = (hallOfFameController, rootElt, hallOfFame) => {
  Log.debug(`hallOfFameProjector.render()`);
  if (!hallOfFame.length) return;

  let titleElt = rootElt.querySelector("#hallOfFame-title");
  let listElt = rootElt.querySelector("#hallOfFame-list");

  if (!rootElt.classList.contains(`${masterClassName}`)) rootElt.classList.add(`${masterClassName}`);
  if (!titleElt.classList.contains(`${masterClassName}-title`)) titleElt.classList.add(`${masterClassName}-title`);
  if (!listElt.classList.contains(`${masterClassName}-list`)) listElt.classList.add(`${masterClassName}-list`);

  titleElt.innerHTML = "";
  listElt.innerHTML = "";
  titleElt.insertAdjacentElement("beforeend", toDoHallOfFameHeaderElt(hallOfFame));
  hallOfFame.forEach((item) => listElt.insertAdjacentElement("beforeend", toDoHallOfFameElt(item)));

  // Array.from(toDoHallOfFameHeaderElt(hallOfFame).children).forEach(childElt=>rootElt.insertAdjacentElement('beforeend', childElt));
  // hallOfFame.forEach(item => Array.from(toDoHallOfFameElt(item).children).forEach(childElt=>rootElt.insertAdjacentElement('beforeend', childElt)) );
};

const pageCss = `
  .${masterClassName} {
  }

  .${masterClassName}-title, .${masterClassName}-list {
    display: grid;
    box-sizing: border-box;
    width: 100%;
    border: 1px solid #c7c7c7;
    border-radius: 20px;
    grid-template-columns: repeat(4, 1fr);
    padding: 10px;
    row-gap: 5px;
    box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
  }

  .${masterClassName}-title {
    margin-bottom:12px;
  }

  .${masterClassName}-label, .${masterClassName}-row {
    display: contents;
  }

  .${masterClassName}-label span {
      background-color: #ff00000d;
  }

  .${masterClassName}-label span, .${masterClassName}-row span {
    text-align: center;
    padding: 10px;
    border-bottom: 1px solid #c7c7c7;
    border-top: 1px solid #c7c7c7;
    display:flex;
    justify-content:center;
    align-items:center;
  }

  .${masterClassName}-label span:first-child, .${masterClassName}-row span:first-child {
    border-left: 1px solid #c7c7c7;
    border-top-left-radius: 20px;
    border-bottom-left-radius: 20px;
}

.${masterClassName}-label span:last-child, .${masterClassName}-row span:last-child  {
    border-right: 1px solid #c7c7c7;
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;
}

.${masterClassName}-comment {
    color: #f00;
  }
`;

// .${masterClassName}-list {
//     height: 300px;
//     overflow-y: scroll;
// }
// .${masterClassName}-list::-webkit-scrollbar {
//     width: 0px;
// }
// .${masterClassName}-row:hover span {
//     background-color: #dbeaf4;
//     cursor: pointer;
// }
