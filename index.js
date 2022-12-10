import express from "express";
import * as dotenv from "dotenv";
const app = express();
import dou from "./dou.js";
import path from "path";
//import cp from "child-process";
//import dados from "./dados.json";
import fs from "fs";
import bodyParser from "body-parser";
import schedule from "node-schedule";

const caminho = "./dados.json";

let diarios = "";

const regra = new schedule.RecurrenceRule();
regra.dayOfWeek = [new schedule.Range(1, 5)];
regra.hour = 2;
regra.second = 30;

const scraping_dou = schedule.scheduleJob(regra, async function () {
  console.log("Realizando Scrapimg DOU diário.");
  await dou();
  console.log("Scraping DOU realizado..");
});

(async function () {
  await dou();
  console.log("Continua executando Server na porta 8080.");
})();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

fs.readFile(caminho, "utf-8", (err, conteudo) => {
  diarios = JSON.parse(conteudo);
});

app.get("/dou", (req, res, next) => {
  res.send(diarios);
});

app.listen(8080, () => {
  console.log("Server na porta 8080.");
});
