import express from "express";
import cors from "cors";
import RegisterRouter from "./Router/register.js";
import ResponseRouter from "./Router/response.js";
import { Crypto } from "@peculiar/webcrypto"

global.crypto = new Crypto()

const app = express();

app.use(express.json());
app.use(cors());

app.use("/register", RegisterRouter);
app.use("/response", ResponseRouter);

app.get("/", (req, res, next) => {
  console.log("get");
  console.log(req.body);
  res.send("OKKKK")
});

app.post("/", (req, res, next) => {
    console.log(req.body);
    res.send(200)
});

app.use((error, req, res, next) => {
    console.error(error);
    res.sendStatus(500);
});

const server = app.listen(8080);
