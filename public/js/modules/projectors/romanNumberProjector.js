import { romanize } from "../util.js";

export { numberProjector, pageCss };

const masterClassName = "number-roman";

const numberProjector = (rootElement, value) => {
  rootElement.innerHTML = "";
  const container = document.createElement("span");
  container.classList.add(masterClassName);
  // container.innerHTML  = Array.from({length:value}).reduce((p, c) => p+"I", "");
  container.innerHTML = romanize(value);
  rootElement.appendChild(container);
};

const pageCss = `
  .${masterClassName} {
    font-family: serif;
    font-size: 1.3em;
    display: inline-block;
  }
`;
