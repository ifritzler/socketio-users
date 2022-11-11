import "dotenv/config";
import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import { Server as httpServer } from "http";
import { Server as ioServer } from "socket.io";

let users = []
let counter = 0;

const app = express();
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/health", async (_req, res, next) => {
  try {
    res.status(200).send();
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

const httpServerInstance = new httpServer(app);
const ioServerInstance = new ioServer(httpServerInstance);

ioServerInstance.on("connection", (socket) => {
  console.log("Usuario conectado");
  // Le avisamos a todo el mundo que un usuario se conecto
  users.push(socket.id)
  ioServerInstance.sockets.emit("update_users", users);

  socket.on("disconnect", () => {
    // Le avisamos a todo el mundo que un usuario se desconecto
    console.log("Usuario con el id " + socket.id + " se ha desconectado");
    users = users.filter(id => id != socket.id)
    ioServerInstance.sockets.emit("update_users", users);
  });

  socket.on("new_message_client", (message) => {
    try {
      // Le avisamos a todo el mundo que un usuario se desconecto
      console.log(message);
      counter += 1;
      message.timestamp = Date.now();
      socket.emit("new_message_server", { message, counter });
    } catch (error) {
      socket.emit("error_message", error.message);
    }
  });
});

export default httpServerInstance;
