# BLOCKVERSE

A browser-based multiplayer game hub. Launch title: **Fight Sim**, a 30-player
open-PvP blocky-avatar sword fighting game. All code, models (procedural box
rigs), and branding are original — no third-party platform's name, logo, or
assets are used anywhere.

`BLOCKVERSE` is a placeholder name. Rename the whole platform by editing one
constant: [`web/src/lib/platformConfig.ts`](web/src/lib/platformConfig.ts).

## Status

This repo is being built in milestones (see the project plan). Currently
implemented:

- **M1 — done.** Hub shell (game grid, guest login, avatar customizer),
  full 3D Fight Sim scene with the original R6-style 6-box rig, client-side
  movement/physics (Rapier), third-person orbit camera, shift-lock, and
  first-person zoom. Single player, no networking yet.
- **M2 — sword tool, damage, death/respawn vs. a dummy NPC.** Not started.
- **M3 — multiplayer Colyseus server, open PvP, server browser, private
  servers.** `/server` is currently a stub package only.
- **M4 — duels, chat, friends, parties, emotes, sounds, mobile controls,
  settings.** Not started.

## Tech stack

- **Web** (`/web`): Next.js (App Router) + TypeScript, Tailwind, Three.js via
  `@react-three/fiber` + `@react-three/drei`, physics via
  `@dimforge/rapier3d-compat`. Deploys to Vercel.
- **Server** (`/server`): [Colyseus](https://colyseus.io/) (Node), deploys to
  Railway or Fly.io. Chosen over PartyKit because Colyseus gives you
  room-based authoritative state sync (`@colyseus/schema`) and matchmaking
  (`joinOrCreate`) out of the box, and runs as a normal long-lived Node
  process — which a 20–30Hz Rapier physics simulation for up to 30 players
  per room needs. PartyKit's Cloudflare Workers model is a better fit for
  lighter, edge-friendly realtime apps (chat, cursors) than a CPU-bound
  physics-ticking combat server.
- **Shared** (`/shared`): plain TypeScript, no build step. Every tunable
  gameplay number (speeds, damage, cooldowns, max players per server, tick
  rate, etc.) lives in [`shared/config.ts`](shared/config.ts) — change the
  game's feel in one place.

Monorepo via npm workspaces (`web`, `server`, `shared`).

## Local development

Requires Node 18+ and npm.

```bash
npm install                 # installs all three workspaces
cp web/.env.local.example web/.env.local
npm run dev                 # starts the Next.js dev server (web only, for now)
```

Open http://localhost:3000.

Once the Colyseus server exists (M3), run both together from two terminals:

```bash
npm run dev:server   # /server, default port 2567
npm run dev:web      # /web, port 3000
```

For M3, test multiplayer by opening multiple browser tabs (or windows) at
`localhost:3000` as different guest usernames and joining the same server —
each tab is a separate player.

### Environment variables

| Var | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_GAME_SERVER_URL` | `web/.env.local` | WebSocket URL of the Colyseus server. Defaults to `ws://localhost:2567` locally. |

## Deploying

### `/web` → Vercel

```bash
cd web
vercel        # first deploy, links the project
vercel --prod # production deploy
```

Set `NEXT_PUBLIC_GAME_SERVER_URL` in the Vercel project's environment
variables to your deployed Colyseus server's `wss://` URL.

### `/server` → Railway or Fly.io

The server needs a persistent process (not serverless) because it holds
WebSocket connections and ticks physics continuously. Either works:

- **Railway**: create a new service pointed at `/server`, set the start
  command to `npm run start --workspace=server` (once M3 adds a real
  build/start script), and expose the port Colyseus listens on.
- **Fly.io**: `fly launch` from `/server` with a `Dockerfile` (to be added in
  M3), `fly deploy` after.

Point the web app's `NEXT_PUBLIC_GAME_SERVER_URL` at whichever host you pick.

## Adding a new game to the hub

1. Create `web/src/games/<your-game>/` (3D scene, controllers, etc. — mirror
   the `fight-sim` structure under `web/src/components/game` if it needs a
   full 3D scene, or keep it self-contained in its own folder).
2. Create `web/src/app/games/<your-game>/page.tsx` that renders it.
3. Add one entry to [`web/src/games/registry.ts`](web/src/games/registry.ts):

   ```ts
   {
     id: "your-game",
     title: "Your Game",
     description: "...",
     thumbnail: "🎮",
     route: "/games/your-game",
     getLivePlayerCount: () => 0, // wire to a real server once it has one
   }
   ```

That's it — the hub's home page grid picks it up automatically. If it's
multiplayer, add a matching Colyseus room under `server/src/rooms/`.

## Project structure

```
blockverse/
├── shared/     # config.ts, types.ts, damage.ts — imported by both web and server
├── server/     # Colyseus game server (stub until M3)
└── web/        # Next.js hub + game client
    └── src/
        ├── app/                 # routes: /, /avatar, /games/fight-sim
        ├── games/registry.ts    # game registry (see above)
        ├── components/hub/      # hub UI (game cards, username prompt)
        ├── components/game/     # 3D rig, animator, camera, input, physics
        └── lib/                 # session/auth stub, platform config
```
