# Super Auto Dwarves - Next

A fantasy auto-battler inspired by Super Auto Pets, Choose Your Own Adventure games, and Dungeons & Dragons. The game features both PvE and asynchronous PvP battles.

> **Status:** Architecture and tech stack decided; project scaffolded. The **fundamental battle system** is now specified (see [Battle system](#battle-system)). Other game systems (cards, progression, shopping, abilities) remain to be defined — see the [Roadmap](#roadmap) and `CLAUDE.md` for contributor/architecture conventions.

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

## Battle system

This describes the **fundamental battle system** — the base combat loop that everything else builds on. Character **abilities** and **triggered effects** will extend this later; they are noted here as future additions but are not part of the fundamental system.

**Rosters.** Each side brings an ordered roster of up to 7 characters. A roster is a **contiguous, front-anchored line**: the front character is first, and any empty space is only ever at the back (behind the rearmost character) — never between characters. Players may arrange characters with gaps during the shopping phase, but the roster is "squeezed" into a gapless line when a battle begins. Battle logic always receives an already-contiguous roster.

**Positions are relative, never absolute.** Because characters drop and the line shuffles forward constantly, absolute slot numbers are meaningless mid-battle. All positional logic refers to _relative_ position ("the front character", "the rearmost", "the character directly behind") — never a fixed slot index. (This matters mainly for future abilities, but the principle is baked in from the start.)

**The turn.** Every turn is the same single exchange:

1. The **front character of each roster attacks simultaneously.** Each deals damage equal to its own `attack` stat to the opposing front character.
2. Damage subtracts from the target's `hp`.
3. Any character at **0 hp or below drops** — it is removed from battle, and its roster shuffles forward so a new character fills the front.

Non-front characters do nothing in the fundamental system (abilities will later let them act).

**Simultaneity.** The two front characters attack _at the same time_: both attacks are resolved against the state as it was at the start of the turn, so a character's death does not cancel the blow it already threw. If both front characters would drop each other in the same turn, **both drop**.

**Ending.** The battle ends when at least one roster is empty. The side with characters remaining **wins**; if both rosters empty on the same turn, it's a **draw**.

**Future extension.** Abilities and triggered effects (e.g. "on battle start", "on taking damage", "on drop") build on this loop without changing its fundamentals. They are out of scope for the fundamental system and specified separately when added.

For the technical design of how a battle is computed, transmitted, replayed, and animated (the event stream, `applyEvent`, animation beats), see the "Battle data architecture" section in `CLAUDE.md`.

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

> _Setup instructions to be completed._

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

The **fundamental battle system** is specified (see above). Still to be specified and implemented:

- [x] Turn structure and win/loss/draw conditions _(fundamental battle system)_
- [x] Battle resolution model — event stream, resolve-once/replay-many _(see `CLAUDE.md`)_
- [ ] Card model and card types
- [ ] Character stats and progression / leveling rules
- [ ] Roster construction and constraints (shopping phase)
- [ ] Character abilities and triggered effects (extends the fundamental battle system)
- [ ] Data model (Prisma schema) for the above
