export const renderSlider = (elt) => () => {
  elt.setAttribute("slider-value", elt.value);
  let percent = ((elt.value - elt.min) * 100) / (elt.max - elt.min);
  elt.style.setProperty("--slider-percent", `${percent}%`);
  elt.style.setProperty(
    "--background",
    getComputedStyle(elt)
      .getPropertyValue("--background-template")
      .replace("[[PERCENT]]", `${describeArc(15, 15, 14, 0, 3.5999 * percent)}`)
  );
};

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const d = ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  return d;
};

export const renderSliders = (rootElt) => {
  rootElt.querySelectorAll("input[type=range].slider").forEach((elt) => {
    renderSlider(elt)();
    elt.addEventListener("input", (_) => renderSlider(elt)());
  });
};
