@AGENTS.md

# CLAUDE.md — Super Auto Dwarves - Next

Guidance for working in this codebase. This file records **deliberate decisions and the reasons behind them** so that future work stays consistent. Where a reason is given, respect it — or revisit it explicitly rather than drifting away from it by accident. For a general project overview and the tech stack, see `README.md`; this file focuses on the rules that steer how code is written.

> The `@AGENTS.md` import above pulls in the create-next-app-generated Next.js framework conventions. That file covers _framework-level_ up-to-date Next.js guidance; this file (`CLAUDE.md`) covers _project-specific_ architecture and rules. The two are complementary.

> **Status:** Architecture documented; project scaffolded. The **fundamental battle system** and its data architecture are defined (see "Battle data architecture"). Other game rules (cards, progression, shopping, abilities) are **not yet defined** and must **not** be invented. See "Game logic — not yet specified" at the end.

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

## Battle data architecture

This is the technical design for how a battle is computed, transmitted, replayed, and animated. It is a direct application of the standing principles above (determinism, pure logic, server authority, shared-JS). It covers the **fundamental battle system**; abilities extend it along the seams noted below without changing this structure.

For the game-facing mechanics (the turn loop, roster rules, win/draw conditions), see the "Battle system" section in `README.md`. This section is about the **data and the code architecture**, not the rules.

### Resolve once, replay many

A battle is **not** streamed or computed live as the player watches. Because a battle is fully deterministic given two rosters, the entire battle is **resolved up front** into a complete record, and the UI **plays that record back** step by step.

A resolved battle is:

```
{ initialState, events[] }
```

- `initialState` — the two rosters as they enter combat (contiguous, front-anchored).
- `events` — a flat, ordered stream of **atomic state-change events** describing everything that happened, start to finish.

The state at **any point** in the battle is **derived**, not stored: start from `initialState` and apply events in order up to that point. Do **not** store a full roster snapshot per event — that is redundant and bloated. Store `initialState` + the event stream; derive everything else by replay. (If replay ever became expensive — it won't at 7v7 scale — occasional checkpoint snapshots are the escape hatch. Not needed.)

### The three operations (keep them separate)

1. **Generating** events — the resolver decides _what happens_ (the rules). **Backend only.**
2. **Applying** an event — `applyEvent(state, event) → newState`. Pure, deterministic, no side effects, no logging. **Shared by backend and frontend.**
3. **Logging** — recording events into the stream. This is **not** a step inside `applyEvent`; it is simply the resolver pushing each event it generates into the `events` array. **Backend only** (the frontend receives a finished array — nothing to log).

**`applyEvent` is the pure, shared core.** It is imported by both sides and is identical in both:

- **Backend resolver loop:** decide an event → push it to `events` (this _is_ the "logging") → `applyEvent` to advance working state → decide the next event. Because the resolver's only way to change state is create-record-apply, **every state change is captured automatically** — there is no separate "remember to log" step, and no way to mutate state without emitting an event.
- **Frontend playback loop:** for each event (on Advance / on a timer) → `applyEvent` to advance the displayed state → dispatch the animation for that event.

The frontend therefore **does not replicate battle logic.** It never _decides_ anything — it replays a transcript of outcomes. The complex, rules-heavy part (event _generation_) lives only on the backend; the frontend shares only the trivial part (event _application_). This is what guarantees consistency with no drift: there is exactly one `applyEvent`.

**Corollary — events carry outcomes, not just deltas.** Each event should carry enough _resulting_ state that applying it needs no game knowledge, only assignment. A `DAMAGE` event carries the resulting `hp`, not just "subtract N" — so the frontend cannot compute it wrong; it just sets the stated value.

### State-change events vs. trigger points (critical distinction)

Two different concepts must not be conflated:

- **State-change events** — things that _change game state_. These are the **logged** events: the discriminated union that makes up `events[]`. They are replayed and animated. Examples (fundamental system): `ATTACK`, `DAMAGE`, `DROP`, `BATTLE_END`.
- **Trigger points** — _named moments_ in the resolver's flow where abilities may fire (e.g. `onBattleStart`, `onAttack`, `onTakeDamage`, `onDrop`, `onBattleEnd`). These are **backend-only resolver concepts**. They are **not** logged, **not** sent to the frontend, and **not** events. They are where the resolver _decides whether to generate more state-change events_.

The relationship: applying a state-change event may reach a trigger point → the resolver checks for abilities listening there → any that fire **generate further state-change events** → which may reach further trigger points. State changes are logged; trigger points are the joints between them.

**Worked example — "on battle start, gain +2 attack":**

- "Battle start" is a **trigger point** (not logged — nothing about the start itself changes roster state).
- The resolver, at that trigger point, fires the ability, which produces a **state-change event** (e.g. `STAT_CHANGE`, target id, resulting attack) — _this_ is logged, replayed, and animated.

**The abilities seam:** in the fundamental system, the resolver passes through the trigger points but **nothing is listening**, so no ability-driven events are generated. Abilities, when added, are **listeners registered at trigger points** that emit additional state-change events. This means abilities extend _what fires at trigger points_ without changing the event-log structure or `applyEvent`. Design the trigger-point set now (as resolver skeleton) even though nothing listens yet; keep the logged-event vocabulary small and outcome-based.

### Events are a discriminated union

Logged events are a TypeScript **discriminated union** keyed on a `type` field. Each type carries exactly the fields it needs; `switch (event.type)` narrows the shape. This serves both consumers: `applyEvent` switches on type to mutate correctly, and the animation dispatcher switches on type to choose the animation — both type-checked. The union of event types also _is_ the documentation of "everything that can happen in a battle."

Fundamental-system events (starting set — refine during implementation):

- `ATTACK` — `{ attackerId, targetId, value }`. The lunge/bash beat. Per simultaneity, a turn emits **two** of these (both fronts) before any `DAMAGE` is applied (declare-then-apply).
- `DAMAGE` — `{ targetId, amount, resultingHp, source }`. The flinch / hp-bar-drop beat. Carries **resulting hp** (outcome, not delta) and a **`source`** identifying causality (see below).
- `DROP` — `{ characterId }`. The death beat. Applying it removes the character from the roster; contiguity/shuffle-forward is the automatic consequence of removing from an ordered list (no separate event unless the shuffle needs to animate as a distinct beat — decide during the animation phase).
- `BATTLE_END` — `{ outcome: "playerWin" | "enemyWin" | "draw" }`. The final beat.

### Animation beats: one event ≠ one animation

Event granularity serves the **logic**; animation granularity serves the **frontend**. The frontend bridges them: it **groups multiple events into a single choreographed beat.**

Example — one turn's exchange produces four events (`ATTACK`, `ATTACK`, `DAMAGE`, `DAMAGE`). The desired animation is **one beat**: both characters bash simultaneously and both hp bars tick down on impact. The frontend consumes the group and choreographs the sub-parts (lunge → impact → hp drop) within that single beat, even though they came from four separate events.

- **Grouping** — how the frontend knows which events form one beat — should be **explicit metadata** (e.g. a beat/group id on events), not inferred from event types. This encodes _intent_, and generalizes to ability cascades where an arbitrary number of events should read as one beat (or as a deliberate sequence). Grouping is about **pacing**.
- **Source attribution** — the `source` field on `DAMAGE` (and similar "something happened to X" events) says _where it came from_ (which attacker, or later which ability). This makes each event self-describing about causality, independent of grouping, and supports UI like attributed combat text ("4 — Borin"). Source is about **causality**; keep it separate from grouping.

### Testability

Both halves are pure and unit-testable with no DB, no UI:

- `resolveBattle(rosterA, rosterB) → { initialState, events[] }` — the resolver (backend-only, rules-heavy).
- `applyEvent(state, event) → newState` — the shared applier (feed state + event, assert on output state).

The fundamental battle system should be covered exhaustively at this level before any UI or persistence is wired in.

---

## Security / anti-cheat model

**The server is always the source of truth. The client is never trusted.** Anything a player could benefit from cheating at must be computed and validated server-side, against server-held state.

**Where "server" is, concretely:** the deployed Next.js app (on Vercel) running `"use server"` code — Server Actions, server components, route handlers — which imports the pure logic and connects to Supabase. This code is never shipped to the browser; the browser only receives the client bundle and reaches the server via the (Next.js-generated) Server Action endpoints. Database credentials live only in server-side env vars. (On Vercel the server side may run as on-demand serverless functions rather than one persistent process — irrelevant to this model; it's still server-side and privileged.)

**The core rule: the client sends _intents_, never _state_ or _outcomes_.** The client says what it wants to _do_; the server decides what _happened_.

- ✅ Client: "buy shop slot 2 → roster slot 4." Server checks what's really in slot 2, whether the player can afford it, whether slot 4 is valid; runs the pure logic against its own state; persists the result.
- ✅ Client: "start the battle." Server runs the deterministic battle from authoritative rosters and _tells_ the client who won (and hands over the event stream to replay).
- ❌ Client: "my roster is now [these characters]" → server saves it. (Forgeable — a god roster.)
- ❌ Client: "I beat the PvE enemy, grant the reward" → server grants it. (Forgeable — never fought.)

**Per-phase cheat surface:**

- **Shopping phase** holds all player agency, so it's the cheatable surface. Every buy/sell/move/upgrade is an _intent_ the server validates against authoritative state. (This mirrors a conventional server-authoritative purchase endpoint.)
- **Battle phase** is inherently cheat-resistant because battles are deterministic: the server computes the canonical outcome (and the event stream) from server-authoritative rosters. The client may _replay_ the event stream for animation, but cannot change the result. Determinism (chosen for the PvP snapshot model) doubles as anti-cheat here.

**Client-side logic, if used at all, is optional prediction only** — optimistic UI, disabling unaffordable buttons — and the server always re-validates. Never let a client-side computation stand as truth.

---

## Testing

Use **Vitest**. (Background: Rails fuses logic and persistence in the model layer; this stack separates them — so logic is tested in isolation, with no DB.)

- **Bulk of tests = pure-logic unit tests** over the framework-free game-logic modules (battle system, progression, turn resolution). The complex battle system should be covered exhaustively. No DB setup/teardown needed. In particular: `resolveBattle` and `applyEvent` (see "Battle data architecture") are pure and should be tested exhaustively.
- **Smaller set of integration tests** for persistence wiring (Server Actions that load → run logic → save). Either against a real test Postgres (local Docker or the Supabase CLI's local instance, reset between runs) or by mocking the Prisma client.
- Shape is the standard **testing pyramid**: many fast pure-logic tests, fewer integration tests.
- **Do NOT write tests against Supabase itself** — it's infrastructure. Test our own code.

---

## Conventions & guardrails

- Keep game logic in pure modules. Never inline it into components, actions, or queries.
- Always use explicit, descriptive names — never terse abbreviations. Full words for all variables, including short-lived callback parameters: character not c, event not e, roster.map((character) => ...) never .map((c) => ...). This is a hard rule, no exceptions for "trivial" one-liners. Readability is favoured over brevity throughout — this is a solo, learning-oriented codebase where legibility when returning to code cold matters more than saving keystrokes.
- No game loop / `requestAnimationFrame` / frame-based animation. Animations are declarative — CSS transitions for simple changes, Framer Motion for orchestrated/sequenced motion. The frame-loop escape hatch should essentially never be opened.
- Don't add Next.js features that don't do real work. Every server-rendered page, action, or route should have a genuine product reason.
- Keep persistence behind a clear seam so its implementation can change without rippling through the app.
- Prefer Server Actions for mutations; reserve Route Handlers for cases that genuinely need an HTTP endpoint.
- Server is the source of truth: validate every player action server-side against server-held state. The client sends _intents_, never _state_ or _outcomes_. See "Security / anti-cheat model."
- Battle logic: never mutate battle state except by creating an event and applying it via the shared `applyEvent`. This keeps the event log complete automatically and keeps backend/frontend consistent. See "Battle data architecture."
- Use shadcn/ui for standard app UI (menus, buttons, dialogs); these components are copied into the codebase and owned here, so edit them freely.
- Visual/UI verification is performed by the human, never by an automated agent. Do not install or invoke browser-automation tooling (Playwright, headless Chromium, chromium-cli, screenshot utilities) to check how a page renders. Agents verify with tsc --noEmit, npm test, and npm run build; the human reviews appearance. If a task's success criterion is visual, report that the code changes are complete and let the human check.

---

## Permanently out of scope

- **Live/real-time multiplayer of any kind** — no matchmaking sessions, no synchronous play, no WebSockets/sockets anywhere. Excluded by design, not deferred. PvP is handled via roster snapshots (see above).

---

## Game logic — not yet specified

The following are intentionally undefined and **must not be invented**. When defined, document them (in the README roadmap and/or here) and implement them as pure, Vitest-tested TypeScript modules per the rules above.

**Defined (do not re-invent — see above):**

- Fundamental battle system: turn structure, simultaneity, drop/shuffle, win/loss/draw (`README.md` → "Battle system").
- Battle data architecture: event stream, `applyEvent`, resolve-once/replay-many, trigger points, animation beats (this file → "Battle data architecture").

**Still undefined:**

- [ ] Card model and card types
- [ ] Character stats and progression / leveling rules
- [ ] Roster construction and constraints (shopping phase)
- [ ] Character abilities and triggered effects (the listeners at the trigger points)
- [ ] Data model (Prisma schema) for the above
