@AGENTS.md

# CLAUDE.md — Super Auto Dwarves - Next

Guidance for working in this codebase. This file records **deliberate decisions and the reasons behind them** so that future work stays consistent. Where a reason is given, respect it — or revisit it explicitly rather than drifting away from it by accident. For a general project overview and the tech stack, see `README.md`; this file focuses on the rules that steer how code is written.

> The `@AGENTS.md` import above pulls in the create-next-app-generated Next.js framework conventions. That file covers _framework-level_ up-to-date Next.js guidance; this file (`CLAUDE.md`) covers _project-specific_ architecture and rules. The two are complementary.

> **Status:** Architecture documented. Game-specific rules (cards, battle formulas, progression, roster constraints) are **not yet defined** and must **not** be invented. See "Game logic — not yet specified" at the end.

---

## Project shape (the constraints that drive everything)

- **It's an event-driven web app, not a real-time game.** No render loop, no `requestAnimationFrame`, no physics, no frames. Nothing changes on screen unless the user acts. Treat it like a normal interactive web app.
- **It's an auto-battler.** All player decisions happen in the shopping/roster-building phase. Once a battle starts it takes no input and is **fully deterministic given the two rosters** (plus any seeded randomness).
- **PvP is pseudo-multiplayer.** Opponents are stored roster snapshots ("images"), not live players. There is never a live connection between players. (Details below.)

---

## The single most important rule: separate logic from everything else

All game logic — battle system, character progression, turn resolution, rules validation — lives in **pure TypeScript modules** completely independent of React, Next.js, Prisma, and Supabase. Pure functions: plain data in, plain data out; no database, no framework, no rendering.

```typescript
// e.g. battle.ts — pure, framework-free, database-free
export function resolveAttack(
  attacker: Character,
  defender: Character,
): AttackResult {
  // ...pure computation...
}
```

**Never embed game logic inside React components, Server Actions, or database queries.** The framework layers only ever _call_ the pure logic.

Why this matters:

1. **Persistence is trivial** — game state is plain data, serializes cleanly.
2. **Clean client/server split** — the same logic can run client-side for responsiveness and server-side for authority.
3. **Deterministic, exhaustively testable battles** — a battle is a pure function of two rosters, so it's easy to unit-test.
4. **Portability** — logic isn't tied to any framework, so future change is additive, not a rewrite.

**"Pure" does not mean "client-side."** Pure describes _how_ the code is written (no side effects, no framework coupling), not _where_ it runs. A pure module is inert until imported; it runs wherever it's imported. The **authoritative** copy of any cheatable logic runs on the **server** (imported into a Server Action). Running the same logic on the client is optional and only ever for prediction/UI — never as the source of truth. See "Security / anti-cheat model" below.

---

## Client vs. server boundary

- **Client island (`"use client"`):** the interactive game board — cards, drag-and-drop, hover states, turn UI, animations. May be a single client component, dynamically imported with `ssr: false` where appropriate.
- **Server-rendered surfaces:** everything _around_ the game — auth flows, leaderboard, player profile pages, match history. Server components fetching from the DB.

Draw this boundary deliberately: a rich client island for play, server-rendered pages around it.

---

## Data layer

- Persistence covers per-user rosters and characters, plus stored roster snapshots used as PvP opponents.
- **In-memory while playing:** plain data structures (`Roster`, `Character`, etc.), mutated directly as turns happen.
- **Supabase is infrastructure, not application.** It provides Postgres (+ auth/storage). **Game logic does NOT live in Supabase** — business rules live in the pure TS modules.
- **Prisma** maps between app and Postgres. Schema-first: edit `schema.prisma`, generate migrations from the diff.
- **Server-side validation of moves and battle resolution** (in Server Actions) keeps logic authoritative and prevents client tampering. See "Security / anti-cheat model" below for the full trust model.

---

## PvP / pseudo-multiplayer model

PvP is a defining feature but is **not** multiplayer in the networking sense — no live connection between players, and two players never need to be online simultaneously.

Because a battle takes no input once started, its outcome is a pure function of the two rosters. So an opponent is just **data**: a cloned snapshot of some player's roster at a given turn. PvP works by (1) snapshotting and storing players' rosters, and (2) selecting a stored snapshot as the adversary and running the deterministic battle against it.

This is how Super Auto Pets operates. Mechanically it's single-player against stored opponent data. It needs only ordinary DB persistence plus the pure, deterministic battle resolver — no sockets, no sessions, no real-time anything.

---

## Security / anti-cheat model

**The server is always the source of truth. The client is never trusted.** Anything a player could benefit from cheating at must be computed and validated server-side, against server-held state.

**Where "server" is, concretely:** the deployed Next.js app (on Vercel) running `"use server"` code — Server Actions, server components, route handlers — which imports the pure logic and connects to Supabase. This code is never shipped to the browser; the browser only receives the client bundle and reaches the server via the (Next.js-generated) Server Action endpoints. Database credentials live only in server-side env vars. (On Vercel the server side may run as on-demand serverless functions rather than one persistent process — irrelevant to this model; it's still server-side and privileged.)

**The core rule: the client sends _intents_, never _state_ or _outcomes_.** The client says what it wants to _do_; the server decides what _happened_.

- ✅ Client: "buy shop slot 2 → roster slot 4." Server checks what's really in slot 2, whether the player can afford it, whether slot 4 is valid; runs the pure logic against its own state; persists the result.
- ✅ Client: "start the battle." Server runs the deterministic battle from authoritative rosters and _tells_ the client who won.
- ❌ Client: "my roster is now [these characters]" → server saves it. (Forgeable — a god roster.)
- ❌ Client: "I beat the PvE enemy, grant the reward" → server grants it. (Forgeable — never fought.)

**Per-phase cheat surface:**

- **Shopping phase** holds all player agency, so it's the cheatable surface. Every buy/sell/move/upgrade is an _intent_ the server validates against authoritative state. (This mirrors a conventional server-authoritative purchase endpoint.)
- **Battle phase** is inherently cheat-resistant because battles are deterministic: the server computes the canonical outcome from server-authoritative rosters. The client may _replay_ the same deterministic battle for animation, but cannot change the result. Determinism (chosen for the PvP snapshot model) doubles as anti-cheat here.

**Client-side logic, if used at all, is optional prediction only** — optimistic UI, disabling unaffordable buttons — and the server always re-validates. Never let a client-side computation stand as truth.

---

## Testing

Use **Vitest**. (Background: Rails fuses logic and persistence in the model layer; this stack separates them — so logic is tested in isolation, with no DB.)

- **Bulk of tests = pure-logic unit tests** over the framework-free game-logic modules (battle system, progression, turn resolution). The complex battle system should be covered exhaustively. No DB setup/teardown needed.
- **Smaller set of integration tests** for persistence wiring (Server Actions that load → run logic → save). Either against a real test Postgres (local Docker or the Supabase CLI's local instance, reset between runs) or by mocking the Prisma client.
- Shape is the standard **testing pyramid**: many fast pure-logic tests, fewer integration tests.
- **Do NOT write tests against Supabase itself** — it's infrastructure. Test our own code.

---

## Conventions & guardrails

- Keep game logic in pure modules. Never inline it into components, actions, or queries.
- No game loop / `requestAnimationFrame` / frame-based animation. Animations are declarative — CSS transitions for simple changes, Framer Motion for orchestrated/sequenced motion. The frame-loop escape hatch should essentially never be opened.
- Don't add Next.js features that don't do real work. Every server-rendered page, action, or route should have a genuine product reason.
- Keep persistence behind a clear seam so its implementation can change without rippling through the app.
- Prefer Server Actions for mutations; reserve Route Handlers for cases that genuinely need an HTTP endpoint.
- Server is the source of truth: validate every player action server-side against server-held state. The client sends _intents_, never _state_ or _outcomes_. See "Security / anti-cheat model."
- Use shadcn/ui for standard app UI (menus, buttons, dialogs); these components are copied into the codebase and owned here, so edit them freely.

---

## Permanently out of scope

- **Live/real-time multiplayer of any kind** — no matchmaking sessions, no synchronous play, no WebSockets/sockets anywhere. Excluded by design, not deferred. PvP is handled via roster snapshots (see above).

---

## Game logic — not yet specified

The following are intentionally undefined and **must not be invented**. When defined, document them (in the README roadmap and/or here) and implement them as pure, Vitest-tested TypeScript modules per the rules above.

- [ ] Card model and card types
- [ ] Battle system rules and damage/resolution formulas
- [ ] Character stats and progression / leveling rules
- [ ] Roster construction and constraints
- [ ] Turn structure and win/loss conditions
- [ ] Data model (Prisma schema) for the above
