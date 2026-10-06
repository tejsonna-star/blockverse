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

// GAME_SERVER_PORT takes priority so local dev (run alongside the web app,
// which also wants to claim whatever PORT the shell/tooling has set) is
// deterministic. Falls back to the platform-injected PORT in production
// (Railway/Fly), then 2567.
const port = Number(process.env.GAME_SERVER_PORT) || Number(process.env.PORT) || 2567;
httpServer.listen(port, () => {
  console.log(`BLOCKVERSE game server listening on :${port}`);
});
