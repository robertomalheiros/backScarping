const { Router } = require("express");
const express = require("express");

const route = new Router(0);

const homeRoute = require("./routes/homeRoute");

route.get("/", homeRoute.paginaInicial);
route.post("/", homeRoute.trataPost);

module.exports = route;
