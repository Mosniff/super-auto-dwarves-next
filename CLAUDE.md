@AGENTS.md

# CLAUDE.md — Super Auto Dwarves - Next

Guidance for working in this codebase. This file records **deliberate decisions and the reasons behind them** so that future work stays consistent. Where a reason is given, respect it — or revisit it explicitly rather than drifting away from it by accident. For a general project overview and the tech stack, see `README.md`; this file focuses on the rules that steer how code is written.

> The `@AGENTS.md` import above pulls in the create-next-app-generated Next.js framework conventions. That file covers _framework-level_ up-to-date Next.js guidance; this file (`CLAUDE.md`) covers _project-specific_ architecture and rules. The two are complementary.

> **Status:** Architecture documented; project scaffolded. The **fundamental battle system** and its data architecture are defined (see "Battle data architecture"). The **save loop** (guest sessions, one save per user, camp ↔ battle) the **basic camp** (a placeholder shop, buying and arranging dwarves) and **real battles** (resolved on the server from the saved roster against a placeholder enemy) are defined and built (see "Persistence & save model" and "Camp: shop, roster and intents"). Phase 9 is making characters real game data: **character classes, tiers and templates** are defined as typed modules (see "Character data: classes, tiers and templates"); owned characters, a slotted shop and template-spawned enemies are in progress. Other game rules (cards, progression, richer shopping, abilities) are **not yet defined** and must **not** be invented. See "Game logic — not yet specified" at the end.

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
- **Connection strings are URLs — percent-encode passwords**. A raw % (or @ # / : ? & +, spaces) in the password inside DATABASE_URL / DIRECT_URL breaks the runtime driver with a cryptic URIError: URI malformed, even though the Prisma CLI may accept the same string. Encode special characters (% → %25, @ → %40, etc.) or use an alphanumeric password. .env.example documents the required variable names; real values live only in the gitignored .env.local.
- **Supabase, Prisma and dnd-kit packages are exact-pinned (no ^/~)**, because @supabase/ssr and @dnd-kit are pre-1.0 and prerelease tags have previously appeared on these packages. @dnd-kit/react and @dnd-kit/dom are both direct, exact-pinned dependencies kept at the same version (dom is imported directly to remove a plugin; see "Camp: shop, roster and intents"). Their own internal @dnd-kit dependencies are pinned by package-lock.json, not by top-level entries — don't add package.json entries for packages the code doesn't import. Upgrade deliberately, one package family at a time, and never run npm audit fix (it can silently replace pinned versions).

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

Every logged event carries a `beatIndex: number` (see "Animation beats" below). In TypeScript this is expressed as `BattleEvent = BattleEventPayload & BeatMetadata`, where `BattleEventPayload` is the discriminated union of payloads and `BeatMetadata` supplies the beat. The resolver emits payloads; `emitEvent` stamps the beat.

The fundamental system's seven events:

- `BATTLE_START` — `{}`. Opens the battle.
- `TURN_START` — `{ turn }`. Opens a turn (numbered from 1). Its own beat.
- `ATTACK` — `{ attackerId, targetId, value }`. The lunge/bash. Per simultaneity, a turn emits **two** (both fronts) before any `DAMAGE` (declare-then-apply). `value` is the clamped damage (never negative).
- `DAMAGE` — `{ targetId, amount, resultingHp, source }`. The flinch / hp-drop. Carries **resulting hp** (outcome, not delta) and a **`source`** for causality.
- `DROP` — `{ characterId }`. The death. Applying it removes the character from `activeCharacters` and appends to that side's `downedCharacters`; the shuffle-forward is the automatic consequence of removing from an ordered list.
- `TIMEOUT` — `{}`. Emitted only when the turn cap is hit in a genuine stalemate (both sides still have characters). Not emitted if the cap turn also produced a wipeout.
- `BATTLE_END` — `{ outcome: "playerWin" | "enemyWin" | "draw" }`. The result.

`ATTACK`, `BATTLE_START`, `TURN_START`, `TIMEOUT`, and `BATTLE_END` are state no-ops — `applyEvent` returns state unchanged for them. Only `DAMAGE` and `DROP` mutate state.

### Character stat ceilings

`maxHp` — every character has a `maxHp`, a hard ceiling on current `hp`. Events that would raise `hp` above `maxHp` must clamp to it, and this clamp is applied in the **resolver** when it computes an event's resulting hp — never inside `applyEvent`, which stays a pure assignment of the stated outcome. No hp-raising event exists in the fundamental system yet (damage only lowers hp), so the ceiling is currently unexercised and documented ahead of future healing/buff events. Damage's resulting hp is **not** floored at 0 — a lethal blow's negative resulting hp is load-bearing for drop detection.

### Animation beats: one event ≠ one animation

Event granularity serves the **logic**; presentation granularity serves the **frontend**. Beats bridge them: every event carries a `beatIndex: number`, and events sharing a beat are presented together as one moment.

The **resolver** assigns beats (not the frontend — grouping is explicit metadata, never inferred from event types). `resolveBattle` keeps a `currentBeat` counter and calls `startNewBeat()` at each boundary; `emitEvent` stamps the current beat onto every payload it emits.

Each beat also carries a `beatType: BeatType` — explicit metadata naming _which kind_ of beat it is, stamped by the resolver alongside `beatIndex`. The six beat types, and the resolver boundary that produces each:

- `BATTLE_START` — the opening beat (beat 0, before any `startNewBeat` call).
- `TURN_START` — opened before each `TURN_START` event.
- `CLASH` — opened before the two `ATTACK`s and two `DAMAGE`s of a turn's exchange; they all share this one beat (this is what makes simultaneity legible). "Clash" names the _beat_ — do not confuse it with the `ATTACK` _event_, which is one character's individual strike.
- `DROP` — opened before the `DROP`(s), only if someone actually drops that turn (a mutual kill puts both `DROP`s in one beat).
- `TIMEOUT` — opened before a `TIMEOUT` event (if emitted).
- `BATTLE_END` — opened before the `BATTLE_END` event.

**Event types describe outcomes (what changed), never presentation context.** The same event type may appear in different beat types — `beatType`, stamped per-emission by the resolver, carries the presentational grouping, not the event type. The animation dispatcher switches on `beatType`, never on event type.

Playback steps one beat at a time, not one event. `deriveBattlePlaybackState(resolvedBattle, playbackBeat, viewingBeat)` applies every event with `beatIndex <= playbackBeat`.

`beatDurationMs(beatType)` is the first consumer of this metadata: `CLASH` and `DROP` are "eventful" beats (longer dwell); every other beat type, and `undefined` (before the first beat), is "quiet" (shorter dwell).

- **Source attribution** — the `source` field on `DAMAGE` says _where it came from_ (which attacker, later which ability). Self-describing causality, independent of beat grouping. Beats are about **pacing**; `source` is about **causality**.

### Playback: two independent positions

Playback tracks two positions, and conflating them is a bug:

- **`playbackBeat`** — how far the battle has progressed. `advance()` moves it forward. Battle state derives from this. It never moves backward.
- **`viewingBeat`** — which beat's log text is displayed. Back/forward controls move it. Moving it does **not** rewind battle state — the user browses the log, they do not scrub the battle.

They usually coincide (advancing snaps the view to the new beat), but the user can page back to re-read an earlier beat while the board still shows the current situation. `advance()` always continues the battle and snaps the view forward, even if the user was browsing history.

This lives in `useBattlePlayback` (React state) on top of the pure `deriveBattlePlaybackState`.

### Playback controls (all in useBattlePlayback, src/hooks/):

advance() — step forward one beat (manual). Snaps viewingBeat to the new playbackBeat.
viewPreviousBeat() / viewNextBeat() — move viewingBeat only, to re-read history; never touch playbackBeat. Bounded by canViewPrevious / canViewNext.
play() / pause() with isPlaying — autoplay advances one beat every AUTOPLAY_INTERVAL_MS (800ms) via a useEffect timer that clears on pause/unmount and self-stops at the final beat.
"Playing = watching": while isPlaying, all manual navigation (advance, back, forward) is disabled in the UI; manual control resumes on pause.
The 800ms fixed interval is a Phase-3 placeholder; Phase 4 animation will likely drive beat advancement off animation completion rather than a fixed timer.

### Testability

Both halves are pure and unit-testable with no DB, no UI:

- `resolveBattle(rosterA, rosterB) → { initialState, events[] }` — the resolver (backend-only, rules-heavy).
- `applyEvent(state, event) → newState` — the shared applier (feed state + event, assert on output state).

The fundamental battle system should be covered exhaustively at this level before any UI or persistence is wired in.

---

## Internationalization (i18n)

The app is multilingual (currently English + Japanese) via next-intl with route-segment locales (/en/..., /ja/...). The guiding principle is the same one that governs everything else: keep language out of the pure logic. Translation is a presentation concern and lives entirely in the presentation layer.

The pure layer is language-agnostic — this is load-bearing. src/lib/battle/ never produces user-facing prose. The battle log is emitted as BattleEventDescriptor values (see types.ts): structured, language-neutral descriptors carrying resolved params ({ kind: "damage", target, amount, resultingHp }), keyed on kind. The resolver and deriveBattlePlaybackState deal only in descriptors. Never put a translatable string, a locale, or a useTranslations call inside src/lib/battle/ — if you're tempted to format a sentence there, emit a descriptor instead and translate it at the edge. This is what lets battle logic stay pure, framework-free, and testable without a locale.

Translation happens at the leaf, not in between. Descriptors flow untouched through the hook (useBattlePlayback) and the intermediate components; only the leaf that actually renders text (InfoScroll) translates them. It maps each descriptor to a message key + params via the pure helper battleLogMessage (descriptor → { key, params }), then renders useTranslations("battle"). Consequences that must be preserved: the hook returns descriptors, so its tests need no i18n provider; and battleLogMessage is pure, so the descriptor→key mapping (including the battleEnd outcome→key indirection: playerWin→victory, etc.) is exhaustively unit-testable without rendering. Note the descriptor carries the raw outcome; the victory/defeat/draw key choice is battleLogMessage's job, not the descriptor's.

Why route segments, not a cookie. Locale is a route segment so the server knows it from the URL — no client round-trip, no flash, shareable/SEO-able URLs, and it's the App Router-native next-intl path. The whole app lives under src/app/[locale]/, which owns <html lang={locale}>; there is no root layout above it. Locale redirects and prefixing are handled by the middleware (see the proxy.ts note under the framework rules).

Character names are game data, not translations — deliberately. Names stay romanized and identical across locales, resolved by the pure layer into descriptors. They are content that will live with the character rows in the database, not translation keys — keeping them out of the message files avoids two stores drifting. (A future romaji→katakana rendering for the Japanese locale was discussed and deliberately deferred; if built, it belongs as character data or a rendering helper, never as translation keys.)

Message files. One flat file per locale (messages/en.json, messages/ja.json), namespaced common._ (UI chrome) and battle._ (log lines). Japanese uses full-width punctuation by convention. A parity test (src/i18n/messages.test.ts) asserts both locales have identical key sets and must be kept green by adding keys to both locales — it is the guard against one locale silently drifting. When you add a user-facing string, add its key to both files and extend the parity test's expected-key list.

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

## Persistence & save model

This defines what is persisted and how a saved game is shaped. It applies the standing rules (server authority, intents-not-outcomes, logic separated from persistence) to the concrete User and Game models. The game systems that will eventually fill these models (cards, shopping, progression, abilities) are still undefined — see "Game logic — not yet specified"; this section defines the save container, not the systems.

A Game is a save-slot of run-state. It holds the durable inputs the pure logic operates on — never derived or presentational state, and never a half-finished battle (consistent with "resolve once, replay many" and "never store per-event snapshots"). Its fields, growing over time:

playerRoster — stored as a JSON column holding the 7-slot camp roster (CampRoster, src/lib/game/campRoster.ts): an array of exactly 7 entries, each a Character or null (an empty slot), index 0 the front, gaps allowed anywhere. Empty slots are null rather than undefined because JSON cannot represent undefined in an array. It is validated on every load by parsePersistedCampRoster (src/lib/persistence/), which rejects anything that isn't exactly 7 characters-or-nulls. Deliberately not normalized into related character/slot tables: the roster is always loaded as a whole for its own game, so JSON avoids an ORM-to-domain mapping layer and a relational diff on every mutation (buy, move, level-up, sell), at the cost of DB-level queryability we don't need. If a future feature genuinely needs to query across rosters (e.g. global character stats), revisit then — don't pre-normalize.
purchasedShopListingIds — the shop listing ids bought during the current camp visit (Postgres TEXT[]). Cleared at the start of every camp. The column is nullable in Postgres even though the generated Prisma client types it string[]: Prisma never adds NOT NULL to array columns, and hand-adding it to a migration would make Prisma report drift. Code treats null as [] at the single trust point (buildGameStateFromLoadedRecord, below).
gold — the player's current gold in this game (scalar column).
day — how many camp→battle loops the player has completed (scalar column).
phase — which part of the loop the player is in (see phase machine below).
revision — an optimistic-concurrency counter (default 0), incremented by every successful save (see "Revision guard" below). It is persistence bookkeeping, not a game rule, so it lives on LoadedGameRecord and SavedGame — never on GameState, and the pure logic never sees it.

Scalars are explicit columns (type-safe, matches Prisma's strengths); the roster is JSON (matches the domain type). This split is deliberate.

**Camp-roster gaps (resolved Phase 8).** README specifies that players may arrange characters with gaps in camp, and the roster is squeezed into a gapless line when a battle begins. The saved roster is therefore the 7-slot camp roster, not the battle Roster. squeezeCampRoster (src/lib/game/campRoster.ts) is the conversion seam: it keeps the non-empty slots in front-to-back order as the battle Roster's activeCharacters, with an empty downedCharacters (nothing is downed outside battle). Battle logic still only ever receives a gapless Roster. Pre-Phase-8 saves in the old Roster shape are not supported — there is deliberately no legacy branch in the parser (nothing was live; development saves were deleted by hand).

**The single trust point.** buildGameStateFromLoadedRecord (src/lib/persistence/) is the only place a stored record becomes trusted GameState: it validates the roster with parsePersistedCampRoster (throwing on anything malformed), defaults a null purchasedShopListingIds to [], and copies the scalars. Every handler that loads a game goes through it; never build a GameState from a record by hand.

One User has at most one Game. Modeled as a separate Game table with a userId and a unique constraint — not as game-state columns on the User row. It's one-to-one today, but a separate table makes the anticipated multi-slot future ("load a game" implies slots) a one-line constraint-drop rather than a table-extraction migration. create inserts a Game (the unique constraint enforces "one game" at the DB level), load fetches it, delete removes it (freeing the user to create again).

The phase machine (newly defined). A game loops between two phases; a brand-new game starts at campPhase, day 1.

campPhase → player advances → battlePhase
battlePhase → player advances → campPhase, and day increments on this transition

Both transitions are driven by a single player "advance" intent — the battle does not self-advance even though the player takes no material action during it; the player dictates when the loop continues. This keeps the loop consistent with intents-not-outcomes: the player's only lever is "advance," and the server computes what advancing means from the current phase. The transition is a pure function (game state → next game state), TDD'd like the battle resolver. adventurePhase (a future step between camp and battle) is deliberately excluded for now — build the two-state machine, extend later.

Start-of-camp reset (decided 25 Oct 2026). The battlePhase → campPhase transition in advanceGame sets gold to CAMP_STARTING_GOLD (10, src/lib/game/campState.ts) — set, not added, so unspent gold is lost — and clears purchasedShopListingIds, so every listing can be bought again. A new game's first camp starts the same way (createNewGameState: seven empty slots, no purchases, 10 gold, day 1, campPhase). The campPhase → battlePhase transition carries roster, gold and purchases through unchanged.

Stale-advance guard. Advancing is load → compute → save, so a repeated intent (double-click, second tab) could skip a phase. Two layers prevent it: buttons disable while their action is pending (PendingSubmitButton, via useFormStatus), and the advance intent carries the phase the player expects to be leaving. advanceGameAction reads it from a form field (expectedCurrentPhase), validates it with the pure isGamePhase, and advanceGameForUser silently does nothing if the saved phase differs — it resolves without error so the redirect just shows the current state. This refines the intents-not-outcomes rule: an action may accept an intent qualifier like this, validated server-side, where the worst a tampered value can do is get the request ignored or rejected. It must never accept game state (roster, gold, day, phase-to-set) or an outcome.

Revision guard (Phase 8). Every mutation is load → compute → save, so two requests racing (two tabs, a fast double action) could each pass their checks and the second save would overwrite the first. Every save is therefore conditional: GameRepository.saveGameState(gameId, nextGameState, expectedRevision) writes only if the row's revision still equals the one that was loaded, increments it on success, and resolves true (saved) or false (the game changed since it was loaded). prismaGameRepository implements this with updateMany filtered on { id, revision } plus revision: { increment: 1 }, checking count === 1 — update can't be used because it requires a unique where and throws when nothing matches. A false is a lost race, not an error: the handler resolves quietly and changes nothing, exactly like a phase mismatch. The stale-advance guard (expected phase) still stands alongside it for advance. Camp intents additionally carry the revision their screen was rendered from (expectedRevision, an intent qualifier) because a stale screen can show the right phase with the wrong slots; a mismatch with the loaded revision is ignored the same way. loadSavedGameForUser exposes the revision on SavedGame for /play to hand to the camp.

Battle currently has no persistent consequence. When the player advances out of battlePhase, the roster carried forward is identical to the one that entered — everyone healed, restored, repositioned; the battle's effects existed only in the playback the player watched. Nothing battle-derived is persisted or consumed. Because battles are deterministic, reloading mid-battlePhase simply re-resolves the identical battle from the locked roster — there is no battle state to lose. (The roster is locked because camp intents arriving outside campPhase are ignored as stale.) This simplicity is a deliberate stepping stone: game-over-on-loss and win-rewards are known future seams that will hang off the battlePhase → campPhase transition (the battle outcome becomes an input to that same pure function). Do not build for them speculatively now, but do not structure the transition in a way that would prevent them.

Auth is Supabase Auth (managed), anonymous-first. Players get a silent guest session — no sign-up screen, no email, no OAuth. A guest is a real auth.users row (is_anonymous = true) with a normal uuid, so the User/Game model is identical for guests and future permanent accounts. Permanent logins (Google OAuth, email) are a deliberate later addition, added as an upgrade path by linking an identity to the existing guest — the uuid stays the same, so the player's Game comes with them. Email-based auth is deferred partly because Supabase's built-in email sender only reaches project team members and is heavily rate-limited; custom SMTP is required before any email flow can serve real players.

Where a guest is created. Only on an explicit player intent: the home page's Play button submits startPlayingAction (src/app/[locale]/startPlayingAction.ts), which runs startPlayerSession (src/lib/session/) with the real Supabase readCurrentUserId and signInAsGuest (src/lib/supabase/) and prismaUserRepository. The proxy never creates sessions — it only refreshes existing ones — because every request, including crawlers, passes through it. Do not add signInAnonymously to the proxy, a Server Component, or a page load.

Verifying identity. Server code verifies the session with supabase.auth.getClaims(), never getSession() (which trusts the cookie unverified). readCurrentUserId returns null only for a genuinely absent session and throws on any other error: treating an Auth hiccup as "signed out" would sign a returning player in as a brand-new guest and orphan their save.

Known pre-launch work, deliberately not built yet: CAPTCHA (e.g. Cloudflare Turnstile) and rate-limit review for anonymous sign-ins, which are otherwise an abuse vector; a periodic cleanup of abandoned anonymous users (the delete trigger already cascades to Game); and a "save your progress" prompt, since a guest who clears their cookies loses access to their save.

Save flow and screens. The home menu and the saves page live in the (menu) route group, whose shared layout owns the title so it never moves between them; each page's card slides in via MenuCardTransition (enter-only, honours reduced motion). Play → startPlayingAction (guest session) → /saves, which shows one SaveSlab: empty with "New game" (createGameAction), or filled with started date (formatted in UTC deliberately, to avoid server/browser hydration mismatches), day, phase, Resume (/play) and Delete (confirmed via AlertDialog, deleteGameAction). A duplicate create (double-submit or second tab) is treated as success and goes to the existing save. /play loads the save via loadSavedGameForUser. In campPhase it renders CampScreen (passing the camp roster, gold, day, purchased listing ids, the shop catalogue, the revision, and the advance, buy and reposition actions). In battlePhase it resolves the battle on the server — resolveCampBattle (src/lib/game/) squeezes the saved camp roster and runs resolveBattle against the placeholder enemy — and renders BattleScreen, which only plays back the { initialState, events } it is given and never computes an outcome. No session → /, no save → /saves. Pages and actions never sign anyone in. The enemy is placeholder data: DUMMY_ENEMY_ROSTER (src/lib/game/dummyEnemyRoster.ts) is a single fixed enemy, Grukk (5 attack, 6 hp), chosen by the human to keep hand-testing quick, until enemy generation (PvE logic, PvP snapshots) is specified. resolveCampBattle takes the enemy as an argument, so real enemy generation slots in without changing it.

Identity spans two schemas. Supabase Auth owns auth.users; Prisma owns our public."User", which mirrors the auth user's uuid. There is deliberately NO foreign key between them: Prisma does not support cross-schema foreign keys, and Supabase documents that referencing its managed schemas causes schema drift as it evolves them. The link is therefore a convention, not a constraint. Deletion is reconciled by an after delete trigger on auth.users (see prisma/manual-sql/), which removes our User row and cascades to the Game. Our User row is created by an idempotent application-side upsert (UserRepository.ensureUserExists, implemented in prismaUserRepository.ts) that runs on every start-playing, not only the first — which also self-heals a session that exists without a User row. This is deliberately NOT an AFTER INSERT trigger on auth.users: a failing trigger blocks every sign-up with Supabase's opaque "Database error saving new user", fires for every bot-created guest, and lives outside the tested codebase. Deletion stays a trigger because users can be deleted outside the app (dashboard, GDPR tooling); creation can only happen through our own code. Do not add a cross-schema foreign key, and do not list auth in the datasource's schemas property.

Mutations follow the existing intents-not-outcomes rule (see "Security / anti-cheat model"): there is never an endpoint that accepts a client-supplied roster or game state. The client sends intents ("advance", "buy listing X into slot N", "move slot A to slot B", later "sell slot 3"); the server reads the authoritative Game, validates, runs pure logic, and persists the result. The JSON storage format does not weaken this — cheating is prevented at the API boundary, independent of how the roster is stored.

---

## Camp: shop, roster and intents

Phase 8 part one made the camp playable: a placeholder shop, buying dwarves into a 7-slot roster, and arranging them — by click or by drag — all server-authoritative. The game rules it implements are listed under "Game logic — not yet specified" → Defined.

**Pure rules (src/lib/game/).** campRoster.ts (CampRoster, CAMP_ROSTER_SLOT_COUNT, createEmptyCampRoster, isCampRosterSlotIndex, squeezeCampRoster), campState.ts (CampState — the slice of run-state the camp rules operate on — and CAMP_STARTING_GOLD), shop.ts (SHOP_CHARACTER_PRICE, CharacterTemplate, ShopListing). buyCharacter and repositionCharacter return a typed result — { outcome: "accepted", next… } or { outcome: "rejected", rejectionReason } — and never throw for a broken rule: a rejection is an expected outcome. Their check orders are documented in the code (buy: invalidSlot, unknownListing, listingAlreadyPurchased, slotOccupied, notEnoughGold; reposition: invalidSlot, sameSlot, sourceSlotEmpty). A bought dwarf is a copy of its listing's template under a fresh id; id generation is a side effect, so it is injected (generateCharacterId) and never happens inside a pure function.

**The shop catalogue is placeholder data.** DUMMY_SHOP_CATALOGUE (src/lib/game/dummyShopCatalogue.ts) is seven fixed listings — the same every visit — until shop logic (stock, rerolls, tiers) is specified. Its stats were copied from the now-removed dummy-battle.ts. It lives server-side; the client receives it only as display data, and prices are never read from the client.

**Handlers (src/lib/persistence/).** buyCharacterForUser and repositionCharacterForUser follow advanceGameForUser's server-authority pattern with a fixed check order: load (no game → throw) → not campPhase → stale → expectedRevision differs from the loaded revision → stale → build GameState via buildGameStateFromLoadedRecord → run the pure rule (rejected → return the reason, save nothing) → save with the loaded revision (false → stale). They return accepted / rejected / stale; the stale checks deliberately come before parsing the roster.

**Server Actions.** buyCharacterAction and repositionCharacterAction (src/app/[locale]/gameActions.ts) read only the intent and its qualifiers — a listing id, slot indices, expectedRevision — through parseIntegerFormValue (src/lib/forms/), which accepts only plain integer text (Number() is too forgiving: "" → 0, "1e2" → 100). Invalid input throws. Accepted, rejected and stale outcomes are all followed by the same response; player-facing rejection messages are deferred along with the rest of error UX.

**In-place actions use refresh(), never a redirect.** The camp actions end with refresh() from next/cache, which re-renders the current page in place and preserves client component state. A redirect to /play — even to the page you're on — is a navigation that remounts the camp, which replayed every roster card's entrance animation on each buy (a real bug, fixed this way). Rule: an action that keeps the player on the same screen uses refresh(); an action that changes screen (advance, create, delete) redirects.

**Click-select is the core interaction and the accessible path.** Click a shop listing then an empty slot to buy; click a dwarf then another slot to move (onto a dwarf: swap); click the selected item again to cancel; clicking a different selectable item switches the selection. Tiles are native <button>s (a shadcn Button's text styling fights a card tile; decided by the human) with aria-label, aria-pressed (= selected) and disabled. It works with mouse, touch, keyboard and screen readers.

**campSelection.ts is the single source of interaction logic** (src/components/game/, pure, no React — next to battleLogMessage.ts):

- resolveCampClick(selection, target, …) → { nextCampSelection, campIntentToSubmit }. Its code comment is the authoritative statement of the click rules. Note one deliberate asymmetry: with a listing selected, clicking an occupied slot changes nothing (it does not switch to that dwarf), so that a future "promotion" rule accepting a buy onto an occupied slot turns that click into a buy without any client change.
- Availability (isShopListingSelectable, isBuyTargetSlot, isRosterSlotSelectable, isRepositionTargetSlot) is derived by asking the same pure rules the server runs what would happen (a preview call to buyCharacter / repositionCharacter) — never by re-implementing checks like "is the slot empty" or "is there enough gold". Hints therefore can't disagree with the server, and rule changes flow to the UI automatically. They are hints only; the server re-validates every intent.
- isCampClickEffective: a tile is clickable exactly when its click would do something (select, cancel, switch or submit).
- resolveCampDrop: a drop is "select the dragged item, then click the target" — resolveCampClick's intent, so drops obey exactly the click rules.
- presentCampTarget: every tile's visual hint, relative to the item in hand (the drag source during a drag, otherwise the click selection): held (it is the item in hand); eligible (placing it here would submit an intent — green ring); ineligible (the click would do nothing — dimmed); neutral (no hint: nothing in hand and nothing wrong, or a click that would switch the selection rather than place). With nothing in hand, a tile holding something you could pick up shows whether you can (an unbuyable listing — too little gold, or a full roster — is ineligible); empty slots stay neutral.

**Styling comes from the presentation state, never from disabled.** disabled governs only what is clickable. This is what lets a mid-drag empty slot show "eligible" while disabled for clicks, and an empty slot with nothing in hand look plainly empty. Each tile carries data-camp-target-presentation so tests can assert the state.

**Pending lock.** Intents are submitted inside useTransition; while one is in flight every tile is disabled, and the camp container is aria-busy with a wait cursor. Tiles are deliberately not dimmed (it would flicker on fast responses). Optimistic UI was deferred in favour of this lock; if it's added later (useOptimistic), the server result must always win.

**Drag-and-drop is a pointer-only convenience layered over click-select** (@dnd-kit/react + @dnd-kit/dom, both exact-pinned):

- sensors={[PointerSensor]}: the keyboard sensor is removed because it starts drags on Space/Enter, which on our native buttons already mean "click" — click-select stays the single keyboard path. The default pointer activation constraints are kept: a plain click (no 5px movement, no 200ms hold) never starts a drag; touch needs a 250ms press.
- dnd-kit's Accessibility plugin is removed (plugins filtered by identity against the imported Accessibility — never by name, which minification breaks). It unconditionally overwrites aria-pressed to mean "being dragged", destroying the selected state, and its default instructions describe a keyboard drag that doesn't exist. Two CampScreen tests guard this (a selected tile keeps aria-pressed="true"; no element has aria-roledescription="draggable").
- DragOverlay renders a floating CharacterCard copy (dropAnimation={null}, so it doesn't fly back while the refresh slides the new card in); the source tile stays put, dimmed.
- Starting a drag clears the click selection. Disabled buttons still work as drop targets (dnd-kit detects collisions geometrically — confirmed by hand).
- dnd-kit's shipped JS lacks "use client" (dropped by its bundler), so it must only be imported from files that already carry the directive.

**Shared components stay battle-safe.** RosterSlab takes an optional slotInteraction; without it (battle) it renders exactly as before. With it, each slot renders InteractiveRosterSlotButton, which owns the per-slot drag/drop hooks. ShopPanel renders unbought listings as DraggableShopListingTile and bought ones as a recessed "Sold" slot, ready for refills when shop refreshes exist.

---

## Character data: classes, tiers and templates

Phase 9 part one made character data real, as pure, read-only TypeScript modules in src/lib/game/. Classes and tiers are **data and display only** for now — they have no gameplay effect. Their future jobs (classes affecting shop slot counts and more; tiers gating which dwarves the shop offers) are not yet specified and must not be invented.

- **Classes** (characterClasses.ts): CHARACTER_CLASS_IDS = ["warrior", "mage", "merchant", "smith", "miner"] as const, CharacterClassId derived from it, and the isCharacterClassId guard. A string-literal union defined once as a list, never a TS enum: readable in code and in saves, the compiler rejects typos, and there are no enum runtime quirks. Ids stay English in code and saves; display names will be translation keys (en + ja, parity list), because class names are interface labels — unlike character names, which are game data.
- **Tiers** (characterTiers.ts): CHARACTER_TIERS = [1, 2, 3, 4, 5] as const, CharacterTier derived from it, and the isCharacterTier guard — the same pattern as classes.
- **Templates** (characterTemplates.ts): CHARACTER_TEMPLATES, a read-only record keyed by template id, plus findCharacterTemplate (an own-property lookup, so a stored id like "toString" can never resolve to a prototype member) and listCharacterTemplates. A CharacterTemplate holds characterTemplateId, name, tier, characterClassIds (1 to 3) and the starting attack and maxHp; every field is readonly. Templates live in a typed module — not YAML, JSON or the database — so adding a character is still "add an entry", tsc catches typos, and server, client and tests import it with no parser or file I/O. Abilities and armour are deliberately absent until they are specified.
- **Template ids** are lowercase kebab-case (borin, old-khaz). An id that has been used in saves is **never renamed or deleted** — only retired from the shop — because owned characters will keep their characterTemplateId.
- **Data guards.** characterTemplates.test.ts checks every template: key equals id, kebab-case id, valid tier, 1–3 valid and distinct classes, a non-negative integer attack and a positive integer maxHp. They guard hand-written data, so they grow in value as templates are added.
- **The templates are the human's to design.** The module holds one example (Borin: tier 1, warrior, 4 attack, 7 maxHp) as the format. Agents must not add templates.
- Transitional: shop.ts still has its own placeholder CharacterTemplate (Omit<Character, "id">), used by the dummy catalogue. It is removed when the shop moves to slots; until then the two same-named types are never imported together.

---

## Testing

Use **Vitest**. (Background: Rails fuses logic and persistence in the model layer; this stack separates them — so logic is tested in isolation, with no DB.)

- **Bulk of tests = pure-logic unit tests** over the framework-free game-logic modules (battle system, progression, turn resolution). The complex battle system should be covered exhaustively. No DB setup/teardown needed. In particular: `resolveBattle` and `applyEvent` (see "Battle data architecture") are pure and should be tested exhaustively.
- **Smaller set of integration tests** for persistence wiring (Server Actions that load → run logic → save). Either against a real test Postgres (local Docker or the Supabase CLI's local instance, reset between runs) or by mocking the Prisma client.
- Shape is the standard **testing pyramid**: many fast pure-logic tests, fewer integration tests.
- **Do NOT write tests against Supabase itself** — it's infrastructure. Test our own code.
- **Persistence handlers are tested with fake GameRepository implementations** that record calls (no database — Docker isn't available in WSL). Assert on whole mapped lists — expect(recordedCalls.map((recordedCall) => recordedCall.expectedRevision)).toEqual([5]) — never index [0] on a possibly empty list, so a red fails on value instead of throwing a TypeError.
- **Server Actions are not unit-tested, by design.** They are kept to parse-and-delegate; the parsing helpers and handlers they call are tested. tsc, build and the human's hands-on check cover the wiring.
- **Red first, with a deliberately wrong stub** for new modules (right name and signature, wrong behaviour), and a written prediction of which tests fail and which pass trivially. Because Vitest doesn't type-check, a reshape can lead with test edits (a genuine behavioural red against the old code) and follow with the type and implementation changes.

### Testing components under the locale tree

Any component rendered in a test that calls useTranslations (or any next-intl client hook) must render inside next-intl's provider, or it throws. Use the shared renderWithMessages helper (src/test/), which wraps the component in NextIntlClientProvider with the real en.json and locale="en" and re-exports Testing Library. Because it uses the real messages, a missing translation key fails the test — which is the intended safety.

Navigation is globally mocked in tests. Components using locale-aware navigation (@/i18n/navigation's Link, useRouter, usePathname) can't render in jsdom without a mounted Next App Router context. Rather than mount Next internals, @/i18n/navigation is globally mocked in vitest.setup.ts — navigation is a framework boundary (Next/next-intl own it), not our code to unit-test. A test that needs to assert a navigation call can import the mocked useRouter and check it. Do not remove this mock or replace it with per-test mounting of Next's router context.

Two supporting config facts, both deliberate: vitest.config.ts inlines next-intl (test.server.deps.inline) so Vitest's resolver follows Next 16's package export map for next-intl's internal next/navigation import; and shadcn Select (Radix) renders its closed trigger cleanly in jsdom, so switcher-style tests assert the closed state and do not try to open the dropdown (Radix's portal + jsdom is flaky on open).

### Testing the camp UI

Test interaction **states**, not **styles**. The logic lives in the pure campSelection.ts and is tested exhaustively there; component tests then check that the right state reaches the DOM — data-camp-target-presentation, disabled, aria-pressed, aria-busy — and that clicks submit the right intent (fake actions record Object.fromEntries(formData); clicks via @testing-library/user-event). Do not assert Tailwind class names: they're tuned by eye, so such tests break on every visual tweak without catching anything, and jsdom doesn't load the stylesheet, so computed styles can't be checked either. Real appearance would need screenshot testing in a browser, which agents must not set up. Pointer dragging is not exercised in jsdom; the click tests double as the guard that dnd-kit doesn't swallow clicks.

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
- Agents only edit files in the working tree and run npx tsc --noEmit, npm run test:run and npm run build (build runs prisma generate, which only writes local files). Anything that touches the database, version control or dependencies is the human's: git (any command), the Prisma CLI against a database (migrate dev, migrate deploy, db push, migrate reset), the Supabase CLI, and npm install / npm audit. Where a task needs one of these, the instructions name it as a step for the human. Agents also never open or print .env files.
- Actions that keep the player on the same screen end with refresh() from next/cache, never with a redirect to the current page. See "Camp: shop, roster and intents".
- The locale middleware lives in src/proxy.ts, not middleware.ts. Next 16 deprecated the middleware.ts filename convention in favour of proxy.ts; next-intl's createMiddleware works identically under either name. Do not rename it back to middleware.ts to match older next-intl docs — the deprecation warning is Next's, and proxy.ts is the current convention. The proxy composes two steps via src/lib/proxy/createComposedProxy.ts: the Supabase session refresh (src/lib/supabase/refreshSupabaseSession.ts) runs FIRST, then next-intl's routing runs on the same request, and the refresh's cookies and cache headers are copied onto next-intl's response, which is the one returned. The order is load-bearing: the refresh rewrites the request's cookies so this request's server render sees the fresh token, and next-intl forwards the request headers as they stand when it runs. Reversing it causes double refreshes and random sign-outs. Test (h) in createComposedProxy.test.ts guards the framework behaviour this relies on — if it fails after a Next or next-intl upgrade, redesign rather than patch. The proxy must stay refresh-only: no sign-in, no redirects, no route protection.

---

## Permanently out of scope

- **Live/real-time multiplayer of any kind** — no matchmaking sessions, no synchronous play, no WebSockets/sockets anywhere. Excluded by design, not deferred. PvP is handled via roster snapshots (see above).

---

## Known non-issues (don't chase these)

removeChild ... not a child of this node when a browser translation extension is active. Running Google Translate (or similar) on top of the app can throw this React error, most visibly around the locale switcher's dropdown. It is a dev-environment / browser-extension artifact, not a code defect: the extension mutates the DOM outside React's knowledge, so React later fails to remove a node the extension already moved. It does not reproduce in a production build with the extension off. Do not "fix" this by adding translate="no"/notranslate or contorting components — suppressing translation tooling on an intentionally multilingual app is the wrong trade. Left as-is by design.

schema "pg_pgrst_no_exposed_schemas" does not exist (SQLSTATE 3F000) in the Supabase logs. This is PostgREST log noise caused by the Data API being deliberately disabled — Supabase does not fully shut PostgREST down and points it at a placeholder schema that doesn't exist. Supabase documents it as harmless. A SQL workaround exists, but it adds another hand-applied database setting outside the repo that must be undone before re-enabling the Data API, so it is deliberately not applied.

---

## Game logic — not yet specified

The following are intentionally undefined and **must not be invented**. When defined, document them (in the README roadmap and/or here) and implement them as pure, Vitest-tested TypeScript modules per the rules above.

**Defined (do not re-invent — see above):**

- Fundamental battle system: turn structure, simultaneity, drop/shuffle, win/loss/draw (`README.md` → "Battle system").
- Battle data architecture: event stream, `applyEvent`, resolve-once/replay-many, trigger points, animation beats (this file → "Battle data architecture").
- `maxHp`: character stat ceiling — clamped only by the resolver, never by `applyEvent` (this file → "Battle data architecture" → "Character stat ceilings").
- Persistence & save model: the User/Game schema shape, the two-phase (campPhase/battlePhase) machine, and the run-state fields (playerRoster as the 7-slot camp roster, purchasedShopListingIds, gold, day, phase, plus the revision counter) — this file → "Persistence & save model". Note: the save container is defined; the game systems below are not.
- New game starting state: createNewGameState (src/lib/game/) returns seven empty camp slots, no purchased listings, 10 gold, day 1, campPhase (decided 13 Oct 2026; camp slots and purchases added in Phase 8).
- Basic camp rules (decided 25–26 Oct 2026 — this file → "Camp: shop, roster and intents"): the roster has 7 slots; gaps are allowed in camp and squeezed out at battle start. The shop is a fixed placeholder catalogue (the seven dwarves from dummy-battle.ts). Every listing costs a flat 3 gold. Each listing can be bought once per camp visit; the same character may be bought again on later visits and may appear in several listings, so duplicates are allowed, each with its own id. Buying must target an empty slot. Moving onto an empty slot moves; moving onto an occupied slot swaps; moving to the same slot is rejected. At the start of every camp, gold is set (not added) to 10 — unspent gold is lost — and purchases are cleared. An empty roster fights and loses instantly (resolveBattle ends with enemyWin; pinned by resolveCampBattle's tests). Selling is out of scope for now.
- Battles in the run (Phase 8 part two): every battlePhase fights the saved camp roster, squeezed into a gapless line, against a placeholder enemy (a single fixed Grukk). Battles still have no persistent consequence.
- Character data (Phase 9 part one, decided 8 Nov 2026): five character classes, tiers 1–5 and character templates as typed read-only modules — this file → "Character data: classes, tiers and templates". Classes and tiers have no gameplay effect yet.

**Still undefined:**

- [ ] Card model and card types
- [ ] Character stats and progression / leveling rules (`maxHp` is now defined — see "Battle data architecture" → "Character stat ceilings")
- [~] Roster construction and constraints (shopping phase): the basic camp rules above are defined. Still undefined: shop stock, rerolls and tiers; selling; "promotion" (buying a copy of a character onto that character, auto-battler style — the click rules already leave room for it); per-turn income beyond the start-of-camp reset.
- [ ] Character abilities and triggered effects (the listeners at the trigger points)
- [ ] Enemy generation: PvE opponents and PvP roster snapshots (a single placeholder enemy stands in — see "Persistence & save model" → save flow)
- [ ] Battle consequences: game over on loss, rewards on win (future seams on advanceGame's battlePhase → campPhase transition)
- [~] Data model (Prisma schema): the User/Game save container is defined (see "Persistence & save model"); the schema for the game systems below (cards, progression, abilities) remains undefined.
