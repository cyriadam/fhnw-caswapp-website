const express = require("express");
const router = new express.Router();
const { hbsProperties } = require("../config/app.config");
const log4js = require("../services/log4j");
let logger = log4js.getLogger("cas-wapp");

// --- Chat pages ---
router.get("", (req, res) => {
  logger.info(`access to 'main' page`);
  res.render("home", { ...hbsProperties, title: "Cas-WebApp" });
});

router.get("/snake", (req, res) => {
  logger.info(`access to 'snake' page`);
  res.render("snake", { ...hbsProperties, title: "Snake" });
});

router.get("/ball", (req, res) => {
  logger.info(`access to 'ball' page`);
  res.render("ball", { ...hbsProperties, title: "Balls" });
});

router.get("/plotter", (req, res) => {
  logger.info(`access to 'plotter' page`);
  res.render("plotter", { ...hbsProperties, title: "Plotter" });
});

router.get("/excel", (req, res) => {
  logger.info(`access to 'excel' page`);
  res.render("excel", { ...hbsProperties, title: "Excel" });
});

router.get("/about", (req, res) => {
  logger.info(`access to 'about' page`);
  res.render("about", { ...hbsProperties, title: "About Me" });
});

router.get("/help", (req, res) => {
  logger.info(`access to 'help' page`);
  res.render("help", {
    ...hbsProperties,
    title: "Help",
  });
});

module.exports = router;
