const path = require("path");

module.exports = {
  filename: `${path.join(__dirname, "../../logs/")}cas-wapp.log`,
  level: "info",
};
