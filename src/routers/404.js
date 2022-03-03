const express = require("express");
const router = new express.Router();
const { hbsProperties } = require("./../config/app.config");
const log4js = require("./../services/log4j");
let logger = log4js.getLogger("404     ");

// --- 404 pages ---
router.get("/help/*", (req, res) => {
  logger.warn(`access to 404 page`);
  res.render("404", {
    ...hbsProperties,
    title: "404",
    errorMessage: "Help article not found",
  });
});

router.get("*", (req, res) => {
  logger.warn(`access to 404 page`);
  res.render("404", {
    ...hbsProperties,
    title: "404",
    errorMessage: "Page not found",
  });
});

module.exports = router;
