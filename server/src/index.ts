import { createServer } from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { FightSimRoom } from "./rooms/FightSimRoom";

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (_req, res) => res.json({ ok: true, service: "blockverse-server" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define("fight_sim", FightSimRoom);

const port = Number(process.env.PORT) || 2567;
httpServer.listen(port, () => {
  console.log(`BLOCKVERSE game server listening on :${port}`);
});
