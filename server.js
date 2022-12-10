const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));

app.listen(8080, () => {
  console.log("Server na porta 8080.");
});

// app.post("/", (req, res) => {
//   console.log(req.body);
//   res.send(`Enviado: ${req.body.nome}`);
// });

// app.get("/teste/:id?", (req, res) => {
//   console.log(req.params);
//   res.send(req.params.id);
// });
