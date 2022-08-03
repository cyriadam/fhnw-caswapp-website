export { numberProjector, pageCss };

const numberProjector = (rootElement, value) => {
  rootElement.innerHTML = value;
  /*
  rootElement.innerHTML = '';
  const container      = document.createElement("span");
  container.innerHTML  = `[${value}]`;
  rootElement.appendChild(container);
  */
};

const pageCss = undefined;
