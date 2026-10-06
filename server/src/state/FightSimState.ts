import { Schema, MapSchema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("string") id = "";
  @type("string") username = "";
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") z = 0;
  @type("number") yaw = 0;
  @type("string") anim = "idle";
  @type("string") headColor = "#f2c48d";
  @type("string") torsoColor = "#2a6fdb";
  @type("string") armsColor = "#f2c48d";
  @type("string") legsColor = "#1f1f1f";
  @type("number") health = 100;
  @type("number") kills = 0;
  @type("number") deaths = 0;
  @type("number") streak = 0;
  @type("boolean") spawnProtected = false;
}

export class FightSimState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
