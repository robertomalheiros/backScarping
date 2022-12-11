import { Cluster } from "puppeteer-cluster";
import { v1 } from "uuid";
import { join } from "path";
import download from "download";
import fs from "fs";
import axios from "axios";
import { response } from "express";

//SE TYPE NÃO FOR MODULE
//const { Cluster } = require("puppeteer-cluster");
//const puppeteer = require("puppeteer");
//const { join } = require("path");
//const download = require("download");
//const fs = require("fs");
let dados = [];
//URL DO DIÁRIO
const url =
  "https://in.gov.br/servicos/diario-oficial-da-uniao/destaques-do-diario-oficial-da-uniao?p_p_id=com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_mhF1RLPnJWPh&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_mhF1RLPnJWPh_delta=20&p_r_p_resetCur=false&_com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_mhF1RLPnJWPh_cur=2";

//Função de Scraping
async function buscaDados({ page }) {
  console.log("2-Executando Render");
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  console.log("3-Abrindo Página");
  const resultsSelector = ".lista-de-dou";

  let dou_detalhes = await page.evaluate(() => {
    //Extrai os detalhes básicos de cada diario
    let listaDOU = document.querySelector(".lista-de-dou");
    console.log("ListaDOU");
    let diarios = Array.from(listaDOU.children);
    console.log("diarios");

    // Percorra cada diario e obtenha seus detalhes
    let diario_info = diarios.map((diarios) => {
      let titulo = diarios.querySelector(".title").innerHTML;
      let orgao = diarios.querySelector(".tag").textContent;
      let imagem = diarios.querySelector(".col-2 > a > img").src;
      let pdf = diarios.querySelector(".col-2 > a").href;
      let dataPublicacao = diarios.querySelector(".date").textContent;

      return { titulo, orgao, imagem, pdf, dataPublicacao };
    });
    return diario_info;
  });

  [...dados] = dou_detalhes;
  //Criando um arquivo JSON com os dados buscados
  // fs.writeFile("dados", JSON.stringify(dou_detalhes, null, 2), (err) => {
  //   if (err) throw new Error("Erro ao criar arquivo.");
  // });

  console.log("4-Finalidando o Render");
  await browser.close();
}
//FUNÇÃO PARA GERAR PDFs
async function gerarPDF({ page, data: { item } }) {
  console.log("Entrando na função gerarPDFs");
  await page.goto(item.pdf, { waitUntil: "networkidle2" });
  console.log("Navegando da Página...");
  let id = v1();
  const output = `./public/${id}.pdf`;
  console.log("Pasta criada.");
  await page.pdf({
    path: output,
    format: "A4",
    landscape: true,
    printBackground: true,
  });
  //FAZENDO POST NA COLLECTION DOCUMENTOS
  try {
    item["pdf"] = `142.93.58.94:8081/${id}.pdf`;
    await axios.post("https://reader-gov-back.cyclic.app/documents", item);
  } catch (error) {
    console.error(error);
  }

  console.log("PDF gerado!", output);
}

//FUNÇÃO MAIN PARA GERAR CLUSTER DO PUPPETEER
async function main() {
  const pid = process.pid;
  try {
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 10,
      headless: false,
      args: ["--no-sandbox", "--disable-setuid--sandbox"],
      ignoreHTTPSErrors: true,
    });

    //EXECUTANDO BUSCA
    await cluster.task(buscaDados);
    await cluster.queue();
    console.log("1-Executando busca de dados.");
    await cluster.idle();
    console.log("5-IDLE de Busca executado");
    await cluster.close();
    console.log("6-Cluster de Busca fechado");
    //console.log(dados);

    //GERANDO PDFs DAS PÁGINAS
    console.log("7-Executando Cluster de PDFs");
    await cluster.task(gerarPDF);
    for (const item of dados) {
      let urlPDF = item.pdf;
      await cluster.queue({ item, name: item.orgao });
    }

    await cluster.idle();
    console.log("10-Executando IDLE PDFs");
    await cluster.close();
    console.log("11-Fechando Cluster de PDFs");
  } catch (error) {
    console.error(`${pid} quebrado! ${error.stack}`);
  }
}
// main();

export default main;
