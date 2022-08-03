const express = require("express");
const router = express.Router();
const { hbsProperties } = require("../config/app.config");
const log4js = require("./../services/log4j");
let logger = log4js.getLogger("cas-wapp".toFixed(10));

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
  res.render("ball-milestone2", { ...hbsProperties, title: "Balls" });
});

router.get("/plotter", (req, res) => {
  logger.info(`access to 'plotter' page`);
  res.render("plotter", { ...hbsProperties, title: "Plotter" });
});

router.get("/excel", (req, res) => {
  logger.info(`access to 'excel' page`);
  res.render("excel", { ...hbsProperties, title: "Excel" });
});

router.get("/tat", (req, res) => {
  logger.info(`access to 'tat' page`);
  res.render("tat", { ...hbsProperties, title: "TAT" });
});

router.get("/toDo", (req, res) => {
  logger.info(`access to 'toDo' page`);
  res.render("toDo-milestone4", { ...hbsProperties, title: "ToDo List" });
});

router.get("/about", (req, res) => {
  logger.info(`access to 'about' page`);
  res.render("about", { ...hbsProperties, title: "About Me" });
});

router.get("/infected", (req, res) => {
  res.render("infected", { ...hbsProperties, title: "Infected" });
});

router.get("/help", (req, res) => {
  logger.info(`access to 'help' page`);
  res.render("help", { ...hbsProperties, title: "Help" });
});

module.exports = router;
