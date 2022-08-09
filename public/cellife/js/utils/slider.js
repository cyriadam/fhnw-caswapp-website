/**
 * @module utils/slider
 * A wrapper on the html input element of type range
 * 
 * Note: 
 * - Need the slider.css   
 * - Values are passed from the element to the pseudo element using attributes slider-value and properties --slider-percent and --background
 * - The image background is dynamically generated from the --background-template svg object
 * 
 * Usage:
 * - Add the class 'slider' to all input of type range
 * <input type="range" min="0" max="5" value="0" class="slider" id="range1" />
 * - Run renderSliders(document.body) to apply the skin to all elements
 */

export { renderSlider, renderSliders };

/**
 * Render a single 'slider' element
 * @param {HTMLElement} elt 
 */
const renderSlider = (elt) => () => {
  elt.setAttribute("slider-value", elt.value);          // the content of the speudo element
  let percent = ((elt.value - elt.min) * 100) / (elt.max - elt.min);
  elt.style.setProperty("--slider-percent", `${percent}%`);
  elt.style.setProperty(
    "--background",
    getComputedStyle(elt)                               // point of interest : access to the property of the element
      .getPropertyValue("--background-template")
      .replace("[[PERCENT]]", `${describeArc(15, 15, 14, 0, 3.5999 * percent)}`)
  );
};

/**
 * Convert polar coords to cartesian coords
 * @param {number} centerX 
 * @param {number} centerY 
 * @param {number} radius 
 * @param {number} angleInDegrees 
 * @returns {Object} { x, y }
 */
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

/**
 * Generate the svg d attribute to render the percent value
 * @param {number} x 
 * @param {number} y 
 * @param {number} radius 
 * @param {number} startAngle 
 * @param {number} endAngle 
 * @returns {String}
 */
const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const d = ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  return d;
};

/**
 * Apply the slider skin to all elements
 * @param {HTMLElement} rootElt 
 */
const renderSliders = (rootElt) => {
  rootElt.querySelectorAll("input[type=range].slider").forEach((elt) => {
    renderSlider(elt)();
    elt.addEventListener("input", (_) => renderSlider(elt)());
  });
};
