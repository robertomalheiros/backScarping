import { Cluster } from "puppeteer-cluster";
import { v1 } from "uuid";
import { join } from "path";
import download from "download";
import fs from "fs";
import axios from "axios";

//SE TYPE NÃO FOR MODULE
//const { Cluster } = require("puppeteer-cluster");
//const puppeteer = require("puppeteer");
//const { join } = require("path");
//const download = require("download");
//const fs = require("fs");

//URL DO SEI
const url =
  "https://sei.trf1.jus.br/sip/login.php?sigla_orgao_sistema=TRF1&sigla_sistema=SEI&infra_url=L3NlaS8=";

//Função de Scraping
async function render({ page }) {
  console.log("2-Executando Render");
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  console.log("3-Abrindo Página");

  await page.type("#txtUsuario", "ba2000930");
  await page.type("#pwdSenha", "B&r&sh!t1312");
  await page.type("#selOrgao", "SJBA");
  const selecionar = "#selOrgao";
  await page.waitForSelector(selecionar);
  await page.click(selecionar);
  await page.type("#selOrgao", "SJBA");
  // const acessar = "#Acessar";
  // await page.waitForSelector(acessar);
  await page.click("#Acessar");

  console.log("Entrei no SEI");

  let dou_detalhes = await page.evaluate(() => {
    //Extrai os detalhes básicos de cada diario
    let listaSEI = document.querySelector(".infraTh");
    console.log("listaSEI");
    let procsSEI = Array.from(listaSEI.children);
    console.log("procsSEI");

    // Percorra cada diario e obtenha seus detalhes
    let diario_info = procsSEI.map((procSEI) => {
      let titulo = procSEI.querySelector(".infraCheckboxDiv ").Tille;
      // let orgao = procsSEI.querySelector(".tag").textContent;
      // let imagem = procsSEI.querySelector(".col-2 > a > img").src;
      // let pdf = procsSEI.querySelector(".col-2 > a").href;
      // let dataPublicacao = procsSEI.querySelector(".date").textContent;
      //dados.push({ titulo, orgao, imagem, pdf, dataPublicacao });

      return { titulo };
    });
    return diario_info;
  });

  //Criando um arquivo JSON com os dados buscados
  fs.writeFile("SEIs", JSON.stringify(dou_detalhes, null, 2), (err) => {
    if (err) throw new Error("Erro ao criar arquivo.");
  });

  //FAZENDO POST NA COLLECTION DOCUMENTOS
  // async function conect() {
  //   try {
  //     for (const item of dou_detalhes) {
  //       await axios.post("https://reader-gov-back.cyclic.app/documents", item);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }
  // conect();

  console.log("4-Finalidando o Render");
  await browser.close();
}
//FUNÇÃO PARA GERAR PDFs
async function gerarPDF({ page, data: { urlPDF } }) {
  console.log("Entrando na função gerarPDFs");
  await page.goto(urlPDF, { waitUntil: "networkidle2" });
  console.log("Navegando da Página...");
  const output = `./output/${v1()}.pdf`;
  console.log("Pasta criada.");
  await page.pdf({
    path: output,
    format: "A4",
    landscape: true,
    printBackground: true,
  });

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
      args: ["--disable-setuid-sandbox"],
      ignoreHTTPSErrors: true,
    });

    //EXECUTANDO BUSCA
    await cluster.task(render);
    await cluster.queue();
    console.log("1-Render executado");
    await cluster.idle();
    console.log("5-IDLE de RENDER executado");
    await cluster.close();
    console.log("6-Cluster de render fechado");

    //GERANDO PDFs DAS PÁGINAS
    // console.log("7-Executando Cluster de PDFs");
    // await cluster.task(gerarPDF);
    // for (const item of dados) {
    //   const urlPDF = item.pdf;
    //   await cluster.queue({ urlPDF, name: item.orgao });
    // }

    // await cluster.idle();
    // console.log("10-Executando IDLE PDFs");
    // await cluster.close();
    // console.log("11-Fechando Cluster de PDFs");
  } catch (error) {
    console.error(`${pid} quebrado! ${error.stack}`);
  }
}
main();

//export default main;
