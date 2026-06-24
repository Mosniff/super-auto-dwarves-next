# Super Auto Dwarves - Next

A fantasy auto-battler inspired by Super Auto Pets, Choose Your Own Adventure games, and Dungeons & Dragons. The game features both PvE and asynchronous PvP battles.

> **Status:** Architecture and tech stack decided; game-specific rules not yet defined. See the [Roadmap](#roadmap) and `CLAUDE.md` for contributor/architecture conventions.

---

## What it is

Super Auto Dwarves - Next is an auto-battler: players spend the **shopping phase** building and developing a roster of characters, then those rosters battle. Once a battle begins it takes no player input — the outcome is determined entirely by the rosters that enter it.

Although it's a game, **it is built as an event-driven web app, not a real-time game.** Interaction is clicking buttons, dragging cards, and advancing turns. There is no render loop, no physics, and no real-time simulation — nothing changes on screen unless the player acts. Architecturally it behaves like a normal interactive web application.

### PvP without live multiplayer

PvP works without any live connection between players. Because a battle is fully deterministic once it starts, an opponent is simply **data**: a stored snapshot ("image") of another player's roster at a given turn. Players battle against these snapshots, so no two players are ever online at the same time. This is the same approach Super Auto Pets uses — mechanically it's closer to single-player against stored opponents than to true multiplayer.

---

## Tech stack

| Layer          | Choice                                              | Notes                                                                                                  |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Framework      | **Next.js** (App Router)                            | Server Components, Server Actions, SSR, dynamic routes.                                                |
| UI library     | **React**                                           | Game board is a client island; surrounding pages are server-rendered.                                  |
| Language       | **TypeScript**                                      | Static typing throughout.                                                                              |
| Styling        | **Tailwind CSS**                                    | Utility-first; ecosystem standard for Next.js.                                                         |
| UI components  | **shadcn/ui**                                       | Copied-in components (Radix + Tailwind) for menus, buttons, dialogs. You own the code.                 |
| Animation      | **Framer Motion** (now published as `motion`) + CSS | CSS transitions for trivial state changes; Framer Motion for orchestrated/sequenced game-board motion. |
| Database       | **PostgreSQL**                                      | Hosted via **Supabase**.                                                                               |
| ORM            | **Prisma**                                          | Schema-first, type-safe.                                                                               |
| Auth           | **Auth.js (NextAuth)**                              | Accounts so rosters persist per user.                                                                  |
| Data mutations | **Server Actions** (preferred) / Route Handlers     | Idiomatic modern Next.js.                                                                              |
| Testing        | **Vitest**                                          | Pure-logic unit tests + lighter integration tests.                                                     |
| Hosting        | **Vercel**                                          | Next.js's native deployment target.                                                                    |

---

## How it's structured

The guiding principle is **separation of game logic from everything else.** All game rules — the battle system, character progression, turn resolution — live in **pure TypeScript modules** independent of React, Next.js, Prisma, and Supabase. They take plain data in and return plain data out.

This keeps battle outcomes deterministic and testable, makes persistence trivial (game state is just data), and gives a clean split between:

- **The client game board** (`"use client"`) — cards, drag-and-drop, animations, turn UI.
- **Server-rendered surfaces** — auth, leaderboard, profile pages, match history — fetching from the database.
- **The data layer** — Prisma over Postgres (Supabase) for per-user rosters/characters and the roster snapshots used as PvP opponents.

The server is always the source of truth: player actions are validated server-side, and the client sends _intents_ (e.g. "buy this slot") rather than asserting outcomes — so request tampering can't grant an advantage. Pure logic is run server-side for anything authoritative; the same logic may run client-side only for prediction/UI.

See `CLAUDE.md` for the full set of architectural rules and conventions.

---

## Testing

Tests use **Vitest**. The bulk are fast pure-logic unit tests over the framework-free game-logic modules (the battle system especially), with a smaller set of integration tests for the persistence wiring. The battle system being a deterministic function of two rosters makes it straightforward to test exhaustively.

---

## Getting started

> _Setup instructions to be completed once the project is scaffolded._

```bash
# install dependencies
# (placeholder)

# run the dev server
# (placeholder)

# run tests
# (placeholder)
```

---

## Roadmap

Game-specific rules are intentionally not yet defined. Still to be specified and implemented:

- [ ] Card model and card types
- [ ] Battle system rules and damage/resolution formulas
- [ ] Character stats and progression / leveling rules
- [ ] Roster construction and constraints
- [ ] Turn structure and win/loss conditions
- [ ] Data model (Prisma schema) for the above
