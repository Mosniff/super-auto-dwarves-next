@AGENTS.md

# CLAUDE.md — Super Auto Dwarves - Next

Guidance for working in this codebase. This file records **deliberate decisions and the reasons behind them** so that future work stays consistent. Where a reason is given, respect it — or revisit it explicitly rather than drifting away from it by accident. For a general project overview and the tech stack, see `README.md`; this file focuses on the rules that steer how code is written.

> The `@AGENTS.md` import above pulls in the create-next-app-generated Next.js framework conventions. That file covers _framework-level_ up-to-date Next.js guidance; this file (`CLAUDE.md`) covers _project-specific_ architecture and rules. The two are complementary.

> **Status:** Architecture documented; project scaffolded. The **fundamental battle system** and its data architecture are defined (see "Battle data architecture"). The **save loop** (guest sessions, one save per user, camp ↔ battle), the **camp** (buying and arranging dwarves) and **real battles** (resolved on the server from the saved roster against a placeholder enemy) are defined and built (see "Persistence & save model" and "Camp: shop, roster and intents"). Phase 9 made characters real game data: **character classes, tiers and templates** are typed modules, **one Character type** (src/lib/game/character.ts) serves camp, shop and battle, every character — the placeholder enemy included — is spawned from a template, and the **character shop** (8 slots rolled on the server, stored with the game, bought from by slot) is built. Character cards show tier and translated classes; locked shop slots show a padlock (see "Character data: classes, tiers and templates" and "Character shop slots"). Phase 10 added **phase transitions**: on every phase change the content below the player's roster swipes forward while the roster stays fixed, and a battle opens with an empty action zone that the front characters enter on the first beat (see "Phase transitions: the game frame and the swipe"). Its visual polish also redesigned the character card as a scaled trading-card frame, moved day, gold, a placeholder gems counter and a single phase-advance button into a game header, hung a phase banner from the roster slab, and gave the camp shop fixed-size tiles with "Coming soon" placeholder sections (see "Game frame: header, phase banner and advancing", "Character data" → Card display, and "Camp: shop, roster and intents"). Other game rules (cards, progression, richer shopping, abilities) are **not yet defined** and must **not** be invented. See "Game logic — not yet specified" at the end.

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
hasBattleStarted — true once the first beat (BATTLE_START) has been applied, i.e. playbackBeat >= 0. Drives the pre-battle presentation (see "Phase transitions: the game frame and the swipe").
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

Message files. One flat file per locale (messages/en.json, messages/ja.json), namespaced common._ (UI chrome), battle._ (log lines), characterClass.\_ (class display names, keyed by class id) and shopSection.\_ (shop section headings, keyed by section id). Japanese uses full-width punctuation by convention. A parity test (src/i18n/messages.test.ts) asserts both locales have identical key sets and must be kept green by adding keys to both locales — it is the guard against one locale silently drifting. When you add a user-facing string, add its key to both files and extend the parity test's expected-key list. The characterClass keys are checked against CHARACTER_CLASS_IDS itself, so adding a class without translating it in both locales fails; likewise the shopSection keys are checked against "characters" plus PLACEHOLDER_SHOP_SECTION_IDS.

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

playerRoster — stored as a JSON column holding the 7-slot camp roster (CampRoster, src/lib/game/campRoster.ts): an array of exactly 7 entries, each a Character (src/lib/game/character.ts) or null (an empty slot), index 0 the front, gaps allowed anywhere. Empty slots are null rather than undefined because JSON cannot represent undefined in an array. It is validated on every load by parsePersistedCampRoster (src/lib/persistence/), which rejects anything that isn't exactly 7 characters-or-nulls. Beyond the battle stats it requires a non-empty characterTemplateId, a valid tier, at least one valid class with no repeats, and (since Phase 11) an experience that is an integer from 0 to 15 (isCharacterExperience — the level is always derived, never stored; Phase 11 saves were deleted by hand, with no legacy branch) — no upper bound, because characters may diverge from their template (only templates are capped at 3). It deliberately does not check that the template id exists in the module: characters are self-contained. Deliberately not normalized into related character/slot tables: the roster is always loaded as a whole for its own game, so JSON avoids an ORM-to-domain mapping layer and a relational diff on every mutation (buy, move, level-up, sell), at the cost of DB-level queryability we don't need. If a future feature genuinely needs to query across rosters (e.g. global character stats), revisit then — don't pre-normalize.
characterShopSlots — the character shop's eight slots as a JSON column (added Phase 9 as shopSlots, renamed by migration drop_purchased_listings_rename_character_shop_slots, which also dropped the Phase 8 purchasedShopListingIds column): each { slotState: "locked" }, { slotState: "offering", characterTemplateId } or { slotState: "sold" }, open slots first. Validated on every load by parsePersistedCharacterShopSlots (src/lib/persistence/). See "Camp: shop, roster and intents" → "Character shop slots".
gold — the player's current gold in this game (scalar column).
day — how many camp→battle loops the player has completed (scalar column).
phase — which part of the loop the player is in (see phase machine below).
revision — an optimistic-concurrency counter (default 0), incremented by every successful save (see "Revision guard" below). It is persistence bookkeeping, not a game rule, so it lives on LoadedGameRecord and SavedGame — never on GameState, and the pure logic never sees it.

Scalars are explicit columns (type-safe, matches Prisma's strengths); the roster is JSON (matches the domain type). This split is deliberate.

**Camp-roster gaps (resolved Phase 8).** README specifies that players may arrange characters with gaps in camp, and the roster is squeezed into a gapless line when a battle begins. The saved roster is therefore the 7-slot camp roster, not the battle Roster. squeezeCampRoster (src/lib/game/campRoster.ts) is the conversion seam: it keeps the non-empty slots in front-to-back order as the battle Roster's activeCharacters, with an empty downedCharacters (nothing is downed outside battle). Battle logic still only ever receives a gapless Roster. Pre-Phase-8 saves in the old Roster shape are not supported — there is deliberately no legacy branch in the parser (nothing was live; development saves were deleted by hand).

**The single trust point.** buildGameStateFromLoadedRecord (src/lib/persistence/) is the only place a stored record becomes trusted GameState: it validates the roster with parsePersistedCampRoster and the character shop with parsePersistedCharacterShopSlots (each throwing on anything malformed), and copies the scalars. Every handler that loads a game goes through it; never build a GameState from a record by hand.

One User has at most one Game. Modeled as a separate Game table with a userId and a unique constraint — not as game-state columns on the User row. It's one-to-one today, but a separate table makes the anticipated multi-slot future ("load a game" implies slots) a one-line constraint-drop rather than a table-extraction migration. create inserts a Game (the unique constraint enforces "one game" at the DB level), load fetches it, delete removes it (freeing the user to create again).

The phase machine (newly defined). A game loops between two phases; a brand-new game starts at campPhase, day 1.

campPhase → player advances → battlePhase
battlePhase → player advances → campPhase, and day increments on this transition

Both transitions are driven by a single player "advance" intent — the battle does not self-advance even though the player takes no material action during it; the player dictates when the loop continues. This keeps the loop consistent with intents-not-outcomes: the player's only lever is "advance," and the server computes what advancing means from the current phase. The transition is a pure function (game state → next game state), TDD'd like the battle resolver. adventurePhase (a future step between camp and battle) is deliberately excluded for now — build the two-state machine, extend later.

Start-of-camp reset (decided 25 Oct 2026; shop re-roll added Phase 9). The battlePhase → campPhase transition in advanceGame sets gold to CAMP_STARTING_GOLD (10, src/lib/game/campState.ts) — set, not added, so unspent gold is lost — and re-rolls every open character shop slot, sold or not, keeping the open-slot count. A new game's first camp starts the same way (createNewGameState: seven empty slots, 10 gold, day 1, campPhase, and a freshly rolled character shop of 3 open and 5 locked slots). The campPhase → battlePhase transition carries roster, gold and shop through unchanged.

Stale-advance guard. Advancing is load → compute → save, so a repeated intent (double-click, second tab) could skip a phase. Two layers prevent it: buttons disable while their action is pending (PendingSubmitButton, via useFormStatus), and the advance intent carries the phase the player expects to be leaving. advanceGameAction reads it from a form field (expectedCurrentPhase), validates it with the pure isGamePhase, and advanceGameForUser silently does nothing if the saved phase differs — it resolves without error so the refresh just shows the current state. This refines the intents-not-outcomes rule: an action may accept an intent qualifier like this, validated server-side, where the worst a tampered value can do is get the request ignored or rejected. It must never accept game state (roster, gold, day, phase-to-set) or an outcome.

Revision guard (Phase 8). Every mutation is load → compute → save, so two requests racing (two tabs, a fast double action) could each pass their checks and the second save would overwrite the first. Every save is therefore conditional: GameRepository.saveGameState(gameId, nextGameState, expectedRevision) writes only if the row's revision still equals the one that was loaded, increments it on success, and resolves true (saved) or false (the game changed since it was loaded). prismaGameRepository implements this with updateMany filtered on { id, revision } plus revision: { increment: 1 }, checking count === 1 — update can't be used because it requires a unique where and throws when nothing matches. A false is a lost race, not an error: the handler resolves quietly and changes nothing, exactly like a phase mismatch. The stale-advance guard (expected phase) still stands alongside it for advance. Camp intents additionally carry the revision their screen was rendered from (expectedRevision, an intent qualifier) because a stale screen can show the right phase with the wrong slots; a mismatch with the loaded revision is ignored the same way. loadSavedGameForUser exposes the revision on SavedGame for /play to hand to the camp.

Battle currently has no persistent consequence. When the player advances out of battlePhase, the roster carried forward is identical to the one that entered — everyone healed, restored, repositioned; the battle's effects existed only in the playback the player watched. Nothing battle-derived is persisted or consumed. Because battles are deterministic, reloading mid-battlePhase simply re-resolves the identical battle from the locked roster — there is no battle state to lose. (The roster is locked because camp intents arriving outside campPhase are ignored as stale.) This simplicity is a deliberate stepping stone: game-over-on-loss and win-rewards are known future seams that will hang off the battlePhase → campPhase transition (the battle outcome becomes an input to that same pure function). Do not build for them speculatively now, but do not structure the transition in a way that would prevent them.

Auth is Supabase Auth (managed), anonymous-first. Players get a silent guest session — no sign-up screen, no email, no OAuth. A guest is a real auth.users row (is_anonymous = true) with a normal uuid, so the User/Game model is identical for guests and future permanent accounts. Permanent logins (Google OAuth, email) are a deliberate later addition, added as an upgrade path by linking an identity to the existing guest — the uuid stays the same, so the player's Game comes with them. Email-based auth is deferred partly because Supabase's built-in email sender only reaches project team members and is heavily rate-limited; custom SMTP is required before any email flow can serve real players.

Where a guest is created. Only on an explicit player intent: the home page's Play button submits startPlayingAction (src/app/[locale]/startPlayingAction.ts), which runs startPlayerSession (src/lib/session/) with the real Supabase readCurrentUserId and signInAsGuest (src/lib/supabase/) and prismaUserRepository. The proxy never creates sessions — it only refreshes existing ones — because every request, including crawlers, passes through it. Do not add signInAnonymously to the proxy, a Server Component, or a page load.

Verifying identity. Server code verifies the session with supabase.auth.getClaims(), never getSession() (which trusts the cookie unverified). readCurrentUserId returns null only for a genuinely absent session and throws on any other error: treating an Auth hiccup as "signed out" would sign a returning player in as a brand-new guest and orphan their save.

Known pre-launch work, deliberately not built yet: CAPTCHA (e.g. Cloudflare Turnstile) and rate-limit review for anonymous sign-ins, which are otherwise an abuse vector; a periodic cleanup of abandoned anonymous users (the delete trigger already cascades to Game); and a "save your progress" prompt, since a guest who clears their cookies loses access to their save.

Save flow and screens. The home menu and the saves page live in the (menu) route group, whose shared layout owns the title so it never moves between them; each page's card slides in via MenuCardTransition (enter-only, honours reduced motion). Play → startPlayingAction (guest session) → /saves, which shows one SaveSlab: empty with "New game" (createGameAction), or filled with started date (formatted in UTC deliberately, to avoid server/browser hydration mismatches), day, phase, Resume (/play) and Delete (confirmed via AlertDialog, deleteGameAction). A duplicate create (double-submit or second tab) is treated as success and goes to the existing save. /play loads the save via loadSavedGameForUser and renders its screen inside the persistent GameScreen frame (see "Phase transitions: the game frame and the swipe"). In campPhase it renders CampScreen (passing the camp roster, gold, day, the character shop slots, the character templates from listCharacterTemplates(), the revision, and the advance, buy and reposition actions). In battlePhase it resolves the battle on the server — resolveCampBattle (src/lib/game/) squeezes the saved camp roster and runs resolveBattle against the placeholder enemy — and renders BattleScreen (with the resolved battle and the saved camp roster, which it shows as-is before the first beat), which only plays back the { initialState, events } it is given and never computes an outcome. No session → /, no save → /saves. Pages and actions never sign anyone in. The enemy is placeholder data: DUMMY_ENEMY_ROSTER (src/lib/game/dummyEnemyRoster.ts) is a single Borin spawned from the borin template (id "enemy-1"), until enemy generation (PvE logic, PvP snapshots) is specified. A one-Borin mirror match ends in a draw, and the battle log reads "Borin attacks Borin" because it names characters, not sides. resolveCampBattle takes the enemy as an argument, so real enemy generation slots in without changing it.

Identity spans two schemas. Supabase Auth owns auth.users; Prisma owns our public."User", which mirrors the auth user's uuid. There is deliberately NO foreign key between them: Prisma does not support cross-schema foreign keys, and Supabase documents that referencing its managed schemas causes schema drift as it evolves them. The link is therefore a convention, not a constraint. Deletion is reconciled by an after delete trigger on auth.users (see prisma/manual-sql/), which removes our User row and cascades to the Game. Our User row is created by an idempotent application-side upsert (UserRepository.ensureUserExists, implemented in prismaUserRepository.ts) that runs on every start-playing, not only the first — which also self-heals a session that exists without a User row. This is deliberately NOT an AFTER INSERT trigger on auth.users: a failing trigger blocks every sign-up with Supabase's opaque "Database error saving new user", fires for every bot-created guest, and lives outside the tested codebase. Deletion stays a trigger because users can be deleted outside the app (dashboard, GDPR tooling); creation can only happen through our own code. Do not add a cross-schema foreign key, and do not list auth in the datasource's schemas property.

Mutations follow the existing intents-not-outcomes rule (see "Security / anti-cheat model"): there is never an endpoint that accepts a client-supplied roster or game state. The client sends intents ("advance", "buy character shop slot N into roster slot M", "move slot A to slot B", "merge slot A into slot B", "sell slot N"); the server reads the authoritative Game, validates, runs pure logic, and persists the result. The JSON storage format does not weaken this — cheating is prevented at the API boundary, independent of how the roster is stored.

---

## Camp: shop, roster and intents

Phase 8 part one made the camp playable — buying dwarves into a 7-slot roster and arranging them, by click or by drag, all server-authoritative — and Phase 9 part 4 replaced its placeholder shop with the real character shop. The game rules it implements are listed under "Game logic — not yet specified" → Defined.

**Pure rules (src/lib/game/).** campRoster.ts (CampRoster, CAMP_ROSTER_SLOT_COUNT, createEmptyCampRoster, isCampRosterSlotIndex, squeezeCampRoster), campState.ts (CampState { campRoster, gold, characterShopSlots } — the slice of run-state the camp rules operate on — and CAMP_STARTING_GOLD), shop.ts (SHOP_CHARACTER_PRICE). buyCharacterFromShopSlot and repositionCharacter return a typed result — { outcome: "accepted", next… } or { outcome: "rejected", rejectionReason } — and never throw for a broken rule: a rejection is an expected outcome. Their check orders are documented in the code (buy: invalidRosterSlot, invalidShopSlot, shopSlotLocked, shopSlotSold, unknownCharacterTemplate, rosterSlotOccupied (a non-matching occupant), rosterSlotAtMaxLevel (a matching level-5 occupant), notEnoughGold; reposition: invalidSlot, sameSlot, sourceSlotEmpty; merge: invalidSlot, sameSlot, sourceSlotEmpty, targetSlotEmpty, charactersDoNotMatch, targetSlotAtMaxLevel; sell: invalidSlot, slotEmpty). A bought dwarf is spawned from the offered template by spawnCharacterFromTemplate under a fresh id and its shop slot becomes sold; id generation is a side effect, so it is injected (generateCharacterId) and never happens inside a pure function. buyCharacterFromShopSlot does its shop-level checks first and its character-specific checks after, with the seam commented: a future equipment section's buy rule would share the shop-level half.

**Experience, merging and selling (Phase 11, decided 15 Nov 2026).**

- **Experience.** A Character carries `experience` (0 to 15); its level is derived, never stored. characterExperience.ts holds the pure rules: EXPERIENCE_REQUIRED_PER_LEVEL_UP = [3, 3, 4, 5] (level 1→2 takes 3 XP … 4→5 takes 5), MAX_CHARACTER_EXPERIENCE (15, derived by summing), MAX_CHARACTER_LEVEL (5), isCharacterExperience, levelFromExperience, characterLevelProgressFromExperience (levelling progress, or maxLevel), addExperience (capped; reports the XP actually gained), gainExperience (+1 attack, +1 max hp **and +1 current hp** per point actually gained) and mergeCharacterInto (the target gains the consumed character's experience + 1, keeping its own id, name and slot; throws if the templates differ — a programmer error, because callers check matching first). Levels have no effect yet; Phase 12's abilities will use them.
- **Matching** means the same characterTemplateId, regardless of name, stats or level. A level-5 dwarf is never a merge target; merging _from_ a level-5 dwarf is allowed and the gain caps at 15 (the excess, and its stat gains, are lost).
- **Merge-buy.** Buying a matching shop character onto a roster dwarf is a merge: the hire is spawned and consumed through mergeCharacterInto (a fresh hire has 0 XP, so it gives exactly 1 XP), at the normal price, and the shop slot becomes sold. buyCharacterFromShopSlot reports `acceptanceKind: "placed" | "merged"`. rosterSlotAtMaxLevel is only ever returned for a matching occupant, so previews can read "matching" from it.
- **Roster merge** (mergeRosterCharacters.ts) merges a roster dwarf into a matching one; the source slot empties. targetSlotAtMaxLevel is likewise only returned for a match.
- **Sell** (sellCharacter.ts) empties a slot and adds CHARACTER_SELL_PRICE (1, in shop.ts — flat for now; future effects will change it, and this is the one place to edit). The last dwarf may be sold; there is no confirmation. sellCharacterRejectionReason is exported so previews ask the rule whether a slot is sellable rather than assuming "occupied means sellable".

**The shop has dedicated sections (decided 9 Nov 2026).** Characters, and later equipment and so on, each get their own slots — offering kinds are never mixed within a slot. The character section is the only one built, so its names say so (CharacterShopSlot, rollCharacterShopSlots, characterShopSlots); another section would sit alongside it with its own slots, counts, rules and buy function.

**Placeholder sections (Phase 10, decided 10 and 14 Nov 2026).** Equipment (4 slots), magic (4) and food (2) are shown alongside the character section as **"Coming soon"** — they are not part of this version of the game. They are **display-only constants** — PLACEHOLDER_SHOP_SECTION_IDS (display order), PlaceholderShopSectionId and PLACEHOLDER_SHOP_SECTION_SLOT_COUNTS in src/lib/game/placeholderShopSections.ts — not stored in the save: nothing about them changes during a run, and their slot shape will change anyway when they get rules, so storing them now would mean a migration and parsers for no behaviour (the human first chose storage, then switched once the cost was laid out). They were first shown as locked and named "locked" sections; when they became "Coming soon" they were renamed to placeholder sections so the names stay true to the concept. When a section gets rules it leaves this list and gets its own module, names (e.g. EquipmentShopSlot) and storage, like the character section. Do not introduce a generic shop-slot type.

**Character shop slots (Phase 9 parts 3–4).** characterShopSlots.ts models the character shop as exactly CHARACTER_SHOP_SLOT_COUNT (8) slots — locked, offering a template id, or sold — with open slots always first. A run starts with STARTING_OPEN_CHARACTER_SHOP_SLOT_COUNT (3) open; open slots will grow during a run (rules unspecified). The open-slot count is **derived** from the slots by countOpenCharacterShopSlots (sold slots are still open) and never stored separately, so the two can never disagree. rollCharacterShopSlots(openShopSlotCount, availableCharacterTemplates, chooseRandomIndex) fills the open slots with uniformly chosen templates (duplicates allowed) and locks the rest; it throws on programmer errors (a bad count, no templates, an out-of-range index) rather than returning a rejection.

- **Rolled once per camp, on the server, and stored.** If offerings were generated per page load, a reload would be a free reroll. createNewGameState rolls a new game's shop; advanceGame's battlePhase → campPhase transition re-rolls it. Both take CharacterShopRollingSources { availableCharacterTemplates, chooseRandomIndex } as their last argument, so they stay pure and tests are deterministic. ChooseRandomIndex lives in its own module (chooseRandomIndex.ts) because any future shop section would reuse it.
- **Randomness is injected, never called.** buildServerCharacterShopRollingSources in gameActions.ts is the single place real randomness enters (listCharacterTemplates() and node's crypto.randomInt), on the server only. Nothing in src/lib/ calls Math.random or crypto. The client never rolls and never sends an offering — only "buy character shop slot N into roster slot M".
- **The shop stores template ids, not template copies**; display and buying look templates up in the characterTemplates list, which the server supplies (the page passes listCharacterTemplates() to the camp as a prop, and the buy action passes it to the handler). parsePersistedCharacterShopSlots checks shape and ordering but deliberately not template existence — template ids are never deleted. An offering whose template can't be found is not buyable (unknownCharacterTemplate) and renders as an unavailable slot.

**Handlers (src/lib/persistence/).** buyCharacterForUser, repositionCharacterForUser, mergeCharacterForUser and sellCharacterForUser follow advanceGameForUser's server-authority pattern with a fixed check order: load (no game → throw) → not campPhase → stale → expectedRevision differs from the loaded revision → stale → build GameState via buildGameStateFromLoadedRecord → run the pure rule (rejected → return the reason, save nothing) → save with the loaded revision (false → stale). They return accepted / rejected / stale; the stale checks deliberately come before parsing the roster.

**Server Actions.** buyCharacterAction, repositionCharacterAction, mergeCharacterAction and sellCharacterAction (src/app/[locale]/gameActions.ts) read only the intent and its qualifiers — slot indices (shopSlotIndex, targetRosterSlotIndex, fromSlotIndex, toSlotIndex, intoSlotIndex, slotIndex) and expectedRevision — through parseIntegerFormValue (src/lib/forms/), which accepts only plain integer text (Number() is too forgiving: "" → 0, "1e2" → 100). Invalid input throws. Templates and prices come from the server, never the client. Accepted, rejected and stale outcomes are all followed by the same response; player-facing rejection messages are deferred along with the rest of error UX.

**In-place actions use refresh(), never a redirect.** The camp actions end with refresh() from next/cache, which re-renders the current page in place and preserves client component state. A redirect to /play — even to the page you're on — is a navigation that remounts the camp, which replayed every roster card's entrance animation on each buy (a real bug, fixed this way). Rule: an action that keeps the player on the same route uses refresh(); an action that changes route (create, delete) redirects. Advance stays on /play, so since Phase 10 it uses refresh() too: the phase swipe depends on GameScreen persisting across a phase change, and a redirect would remount it.

**Click-select is the core interaction and the accessible path.** Click an offering character shop slot then an empty roster slot to buy; click a dwarf then another slot to move (onto a dwarf: swap); click the selected item again to cancel; clicking a different selectable item switches the selection. Tiles are native <button>s (a shadcn Button's text styling fights a card tile; decided by the human) with aria-label, aria-pressed (= selected) and disabled. Sold, locked and unavailable shop slots are not buttons at all. It works with mouse, touch, keyboard and screen readers.

**Merge/sell mode (Phase 11).** A second interaction mode changes only what a held **roster** dwarf does: in "reposition" (the default) it moves or swaps; in "mergeOrSell" it merges into matching dwarves or is sold, and repositioning is off. Shop holds buy (including merge-buys) in either mode. The mode is **client UI state only** — the server receives explicit intents (reposition, mergeCharacters, sellCharacter) and never learns the mode.

- **Two inputs, one derived mode.** campInteractionMode.ts is a pure state machine (events: shiftPressed, shiftReleased, tabPressed, mergeSellToggleClicked, focusLost) holding the toggle latch, Shift-held and "Shift suppressed until release". campInteractionModeFromState returns mergeOrSell when latched or Shift is held — except while a **shop card is held**, when Shift is ignored and only the latch counts (the mode never affects shop holds, so the UI mustn't suggest it does). useCampInteractionMode wires window keydown/keyup/blur and document visibilitychange to it.
- **Shift+Tab** is keyboard focus navigation, so a Tab during a Shift hold reverts the mode and that Shift press stops counting until key-up. **Blur and a hidden page clear a held Shift, never the latch**, so a missed key-up can't leave the mode stuck. Ctrl and Alt were rejected: Ctrl+click is right-click on a Mac and Ctrl is screen readers' "stop speaking" key; releasing Alt focuses the browser menu on Windows.
- **The toggle** (MergeSellToggle) is a short neutral two-sided switch — "Reposition" (並べ替え) left, "Merge / Sell" (合成・売却) right with an italic "(hold SHIFT)" sub-line, identical label styling and a constant-colour track; only the knob moves. Holding Shift moves the knob without latching; clicking latches it and shows a lock in the knob. It is one native button: aria-label "Merge / Sell", aria-pressed = the latch, side labels aria-hidden. It is disabled (and Shift ignored) while a shop card is held; a latch stays visible but inert.
- **Announcements** (MergeSellModeAnnouncer): a polite live region announces the mode only after it has settled for 300 ms and differs from the last announcement, so a quick Shift+Tab says nothing.
- **The sell box** (SellArea) is a dashed-outline button labelled "Sell" (売却) beneath the toggle, a click target and a dnd-kit drop target ({ targetKind: "sellArea" }). It shows only while a roster dwarf is held in merge/sell mode; otherwise it keeps its space but is invisible, aria-hidden, inert and its droppable disabled, so the centred toggle group never shifts. It is only ever a drop _target_: campSelectionFromClickTarget receives drag sources only.
- The camp is select-none, because Shift-click would otherwise extend a text selection.

**campSelection.ts is the single source of interaction logic** (src/components/game/, pure, no React — next to battleLogMessage.ts):

- resolveCampClick(selection, target, campState, characterTemplates) → { nextCampSelection, campIntentToSubmit }. Selections are { characterShopSlot, shopSlotIndex } or { rosterSlot, slotIndex }; click targets are those plus { sellArea }; intents are buyCharacter { shopSlotIndex, targetRosterSlotIndex }, reposition, mergeCharacters { fromSlotIndex, intoSlotIndex } or sellCharacter { slotIndex }. Every function that depends on the interaction mode takes it as an optional **last** argument (default "reposition"); CampScreen always passes it explicitly. Its code comment is the authoritative statement of the click rules. Note one deliberate asymmetry: with a shop slot selected, clicking an occupied roster slot changes nothing (it does not switch to that dwarf) — which is what let Phase 11's merge-buy rule turn a click on a matching dwarf into a buy with no change here.
- Availability (isCharacterShopSlotSelectable, isBuyTargetSlot, isRosterSlotSelectable, isRepositionTargetSlot) is derived by asking the same pure rules the server runs what would happen (a preview call to buyCharacterFromShopSlot / repositionCharacter) — never by re-implementing checks like "is the slot empty", "is the shop slot sold" or "is there enough gold". Hints therefore can't disagree with the server, and rule changes flow to the UI automatically. They are hints only; the server re-validates every intent.
- isCampClickEffective: a tile is clickable exactly when its click would do something (select, cancel, switch or submit).
- resolveCampDrop: a drop is "select the dragged item, then click the target" — resolveCampClick's intent, so drops obey exactly the click rules.
- presentCampTarget: every tile's visual hint, relative to the item in hand (the drag source during a drag, otherwise the click selection): held (it is the item in hand); eligible (placing it here would submit an intent — green ring); ineligible (the click would do nothing — dimmed); neutral (no hint: nothing in hand and nothing wrong, or a click that would switch the selection rather than place). With nothing in hand, a tile holding something you could pick up shows whether you can (an unbuyable listing — too little gold, or a full roster — is ineligible); empty slots stay neutral.

- Phase 11 added three presentations, all derived from the rules' previews: **mergeTarget** (placing here would merge — the eligible ring plus an emerald ChevronsUp badge top-left), **swapTarget** (a reposition onto an occupied slot — the eligible ring plus a sky-blue ArrowRightLeft badge top-left; the two badges never coexist, and the top-right corner stays free for Phase 12's info control), and the sell area's eligible/ineligible. isRosterSlotMatchingHeldItem says whether a slot matches the held item (merge accepted, or rejected for max level) — for roster holds only in merge/sell mode, since in reposition mode the player is moving, not merging. **No component or campSelection code compares characterTemplateId.**

**Styling comes from the presentation state, never from disabled.** disabled governs only what is clickable. This is what lets a mid-drag empty slot show "eligible" while disabled for clicks, and an empty slot with nothing in hand look plainly empty. Each tile carries data-camp-target-presentation so tests can assert the state.

**Pending lock.** Intents are submitted inside useTransition; while one is in flight every tile is disabled, and the camp container is aria-busy with a wait cursor. Tiles are deliberately not dimmed (it would flicker on fast responses). Optimistic UI was deferred in favour of this lock; if it's added later (useOptimistic), the server result must always win.

**Drag-and-drop is a pointer-only convenience layered over click-select** (@dnd-kit/react + @dnd-kit/dom, both exact-pinned):

- sensors={[PointerSensor]}: the keyboard sensor is removed because it starts drags on Space/Enter, which on our native buttons already mean "click" — click-select stays the single keyboard path. The default pointer activation constraints are kept: a plain click (no 5px movement, no 200ms hold) never starts a drag; touch needs a 250ms press.
- dnd-kit's Accessibility plugin is removed (plugins filtered by identity against the imported Accessibility — never by name, which minification breaks). It unconditionally overwrites aria-pressed to mean "being dragged", destroying the selected state, and its default instructions describe a keyboard drag that doesn't exist. Two CampScreen tests guard this (a selected tile keeps aria-pressed="true"; no element has aria-roledescription="draggable").
- DragOverlay renders a floating CharacterCard copy (dropAnimation={null}, so it doesn't fly back while the refresh slides the new card in); the source tile stays put, dimmed.
- Starting a drag clears the click selection. Disabled buttons still work as drop targets (dnd-kit detects collisions geometrically — confirmed by hand).
- dnd-kit's shipped JS lacks "use client" (dropped by its bundler), so it must only be imported from files that already carry the directive.

**Shared components stay battle-safe.** RosterSlab takes an optional slotInteraction; without it (battle) it renders exactly as before. With it, each slot renders InteractiveRosterSlotButton, which owns the per-slot drag/drop hooks. RosterSlab also takes presentsFrontSlotAsOnDeck (default false): only when it's true does slot 0's card get the "NEXT" halo and the grandiose launch exit when it leaves. Battle turns it on for both slabs (the player's via GameScreenShell's presentsPlayerFrontSlotAsOnDeck); camp leaves it off, so its front card moves like any other. The screen decides and the slab never learns the game phase — the same composition principle as slotInteraction, so a future adventure screen can pick its own features.

**ShopPanel** lays the shop out as one band two rows tall under the "Shop" heading: four side-by-side sections, each a region labelled by its translated h3 — characters (4 columns × 2 rows), equipment (2 × 2), magic (2 × 2), food (1 × 2), slots filled left to right, top row first. The character section renders all eight character shop slots, each carrying data-character-shop-slot-state: an offering as DraggableCharacterShopSlotTile (showing the character spawnCharacterFromTemplate would produce, so a shop card always shows exactly what buying gives); a sold slot as a recessed "Sold" slot; a locked slot, or an offering whose template can't be found ("unavailable"), as a recessed slot — locked ones with lucide's Lock icon (aria-hidden) and a translated "Locked" / 未解放 label via LockedSlotContents, unavailable ones empty. Every placeholder-section slot is an empty tile carrying data-shop-section-slot-state="comingSoon", and each placeholder section shows one hourglass + "Coming soon" / 近日公開 label (data-shop-section-coming-soon) laid across its grid through ShopSection's gridOverlay (pointer-events-none). All non-buttons share one RecessedShopSlot, which takes its data attribute from the caller and a slotLook: "open" (sold, unavailable — a lighter, bordered socket), "locked" (flat, darker, faintly hatched) or "comingSoon" (plain and dashed). Offering tiles carry the same faint open border as a CSS border, never a ring, because the presentation states already use ring-2. The looks are --shop-slot-\* variables in globals.css :root.

**Shop sizing.** Every shop tile is one fixed size, and sections shrink to fit their tiles rather than stretching to flex shares (shares minus each section's own gaps made tiles differ between sections). Sizes are three runtime CSS variables in globals.css :root — --shop-tile-width, --shop-tile-gap, --shop-section-gap — fitting a 1920×1080 window by default, with one override for 2560-wide windows inside a nested @variant 3xl { … } block (--breakpoint-3xl is 125rem, in the theme). Components read them with Tailwind's variable shorthand (w-(--shop-tile-width), gap-(--shop-tile-gap), grid-cols-[repeat(N,var(--shop-tile-width))]), so the breakpoint switch happens in one place; the drag overlay uses the same width. They are plain :root variables rather than @theme inline tokens because inline tokens are baked into the utilities and a media query can't change them. CampScreen's pending-lock wrapper is flex flex-1 flex-col so the camp content fills the height and centres vertically.

**Roster slab layout (Phase 11).** RosterSlab is a balanced three-part flex: an empty leading box and a trailing box (both `flex-1 basis-0 min-w-0`) either side of the slot row (`shrink-0`). The side boxes split the leftover width equally, so the slots stay dead centre in every phase — the roster stays fixed during the phase swipe, so camp-only controls must never shift it. The screen passes `trailingControls` (camp: the toggle, the sell box and the announcer); controls wider than the box overflow symmetrically rather than moving the roster. RosterSlab also takes `showsCharacterProgression` (camp's player roster only), which gives cards their level pill and XP bar.

**Camp roster progression display (Phase 11).** Camp roster cards show a level pill and a segmented XP bar (CharacterCard's showLevel / showExperienceBar, both off by default). The XP bar sits mid-portrait over a grey wash, with "Experience" above and "N XP to level L" (or "Max level") below; experienceBarSegments and experienceBarCaption (characterCardDisplay.ts) are the pure display rules. It's hidden until revealed: InteractiveRosterSlotButton sets data-experience-bar-revealed (selected, or matching the held item), and globals.css reveals the bar and wash on hover, keyboard focus or "true" — CSS, not React hover state. Slot labels include the level ("Slot 1: Borin, level 2"). A dragged roster dwarf's floating copy shows its level pill.

**Roster animations (Phase 11).** The camp remembers its last submitted intent with the revision it was sent at; rosterSlotExitKind (rosterSlotAnimation.ts, pure) gives each slot "shuffle", "mergedAway" or "sold", but only when the refreshed roster is at exactly that revision + 1 (every save increments the revision by one), so stale, rejected and unrelated changes keep the plain slide. RosterSlot hands the leaving card its exit kind through AnimatePresence's `custom`: merged-away cards are absorbed in place (brighten, shrink, fade), sold cards drop and fade while a "+1 gold" floater rises (the number comes from CHARACTER_SELL_PRICE). experienceGainBeat compares the same dwarf's experience across a refresh (covering merges and merge-buys alike); a gain plays a pulse, an inset amber ring and a "+N XP" floater, a level-up a bigger pulse, a level-pill pop and "Level up!". The beat is **state exposed as data-experience-beat on the slot root, with the motion in globals.css @keyframes** (tuned by --experience-beat-\* variables, gated on prefers-reduced-motion: no-preference); it waits for the absorb exit so a merge reads as cause then effect. Floaters are declarative motion spans outside the clipped recess. Battle slots always shuffle and never beat; the front slot's launch exit is unchanged; reduced motion makes everything instant.

---

## Phase transitions: the game frame and the swipe

Phase 10 made phase changes read as progress. When the player advances (camp → battle, battle → camp), the content below the player's roster swipes horizontally, always forward (the old content leaves to the left, the new arrives from the right), while the roster stays fixed as permanent screen furniture. Saves → /play is a route change and deliberately does not swipe.

- **Advance re-renders in place.** advanceGameAction ends with refresh(), not a redirect to /play. A redirect is a navigation that remounts the page; refresh() re-renders it in place, so the page's root component persists across a phase change. Everything below depends on this.
- **GameScreen is the persistent frame** (src/components/game/GameScreen.tsx). /play returns <GameScreen phase={…}> at its root in both phases, wrapping CampScreen or BattleScreen. It holds a motion AnimatePresence (initial={false}, so a first load or reload doesn't swipe) whose single child is keyed on the phase, inside a one-cell grid: during a swipe the outgoing and incoming screens are both mounted, stacked in that cell. The phase is display-only — it comes from the server-rendered page and is used only as an animation key, never sent anywhere.
- **GameScreenShell performs the swipe.** Its content region (data-game-screen-region="content") is a motion element that enters from x 100% and exits to -100%. It reads useIsPresent(): while its screen is exiting, its <main> carries data-game-screen-presence="exiting", its roster region is visibility: hidden (keeping its space, so the incoming screen's roster shows in exactly the same place) and both regions are inert, so nothing on a departing screen can be clicked or focused. Reduced motion makes the change instant.
- **State stays in each screen.** The roster looks permanent but is drawn by each screen: CampScreen keeps selection, drag and the pending lock; BattleScreen keeps playback. Two alternatives were rejected. Lifting that state up so the roster is one component instance is only needed if the roster must animate continuously across a phase change (e.g. dwarves returning to their camp slots after a battle) — revisit then. A portal into a frame-owned roster area can't render during server rendering, so the roster would pop in after hydration.
- **Only the swipe exits.** Removing the keyed child plays the exit of every motion component with an exit prop inside it, except those inside their own nested AnimatePresence, which only inherit an ancestor's exit with propagate. RosterSlot's and ActiveCard's cards are nested that way, so they don't play exits during a swipe. Adding an exit prop to a motion element outside a nested AnimatePresence anywhere in the screens will make it animate on every phase change.
- **Roster cards present at mount appear in place.** RosterSlot's AnimatePresence has initial={false}: a roster that mounts (every phase change) shows its cards without the slide-in, while cards added later — buys, moves, battle shuffles — still animate.
- **A battle opens with an empty action zone.** Before the first beat (useBattlePlayback's hasBattleStarted is false), the player's bench shows the saved camp roster exactly as in camp, gaps and front dwarf included; the enemy bench shows its whole lineup; both action-zone slots are empty. From the first beat (BATTLE_START), presentation follows the battle state: each front character is in the action zone and its bench holds the rest, and the existing slot animations play the fronts launching in and the gaps closing. The rule is the pure presentBattleBoard (src/components/game/battleBoardPresentation.ts); it never changes battle state, and nothing in src/lib/battle/ knows about it. So camp → battle shows no roster change at all, and battle → camp snaps the roster to the camp lineup at the start of the swipe (battles have no consequences yet — revisit when they do).
- **Tests.** GameScreenShell.test.tsx guards the exiting state (both regions still mounted, inert, presence "exiting") by removing a shell from an AnimatePresence in jsdom, where motion keeps it mounted while the exit runs. battleBoardPresentation.test.ts covers the pre-battle rule. Swipe appearance, stacking and timing are checked by eye.

---

## Game frame: header, phase banner and advancing

Phase 10 moved game-wide status and controls out of the screens and into furniture that persists across phase changes.

- **The header is rendered by the page, not the layout.** Layouts don't receive the page's data, so /play's page renders GameHeader (an async Server Component) and passes it to GameScreen as its header slot; GameScreen renders it above the swipe grid, so it never swipes and updates in place on refresh() (e.g. gold after a buy). The (game) layout no longer renders a header.
- **Header layout:** two groups pushed apart. Left: the title, an engraved HeaderDivider (a light line with a dark shadow line, fading at both ends; --header-divider-\* in globals.css), the Menu button and the LocaleSwitcher. Right: GameStatus (day, gold, gems) and the PhaseAdvanceButton.
- **Gems are UI only.** There is no gem mechanic; GameHeader passes PLACEHOLDER_GEM_COUNT = 0 to GameStatus. Nothing gem-related exists in game state, saves or rules — replace the constant with the saved count when the mechanic is specified.
- **One phase-advance button** (PhaseAdvanceButton) submits the existing advanceGameAction with expectedCurrentPhase = the current phase, labelled by phase ("To battle" / "Return to camp"). Whether it's enabled is decided by the **present screen**, which reports (gamePhase, isAvailable) through useReportPhaseAdvanceAvailability (src/components/game/phaseAdvanceAvailability.tsx; GameScreen provides the context): camp is available while no camp intent is pending; battle once playback has finished. A report only counts for its own phase, so a stale report from a screen mid-exit can never enable the wrong button; the exiting screen stays silent (useIsPresent), and reporting is a no-op outside a GameScreen. It's visible but disabled when unavailable, and while its own submission is pending (PendingSubmitButton's disabled prop). This is UI only — the server's expected-phase guard still decides.
- **The button never resizes.** Every phase's label is rendered stacked in one grid cell; only the current one is visible, the others are invisible (still taking space) and aria-hidden, so the button is always as wide as its widest label in the current locale and the accessible name is only the current label. New phases join automatically through the Record<GamePhase, …> label map.
- **The phase banner** (GamePhaseBanner) hangs from the roster slab inside GameScreenShell's roster region and is the page's single h1 in both phases. It's a hanging-tab trapezoid cut by clip-path from --texture-phase-banner (red body, end shading, gold stripes) and --phase-banner-slant, so the stripes are cut along the same diagonals; horizontal padding must stay larger than the slant. Its text slides in from the right on a phase change (enter only: the outgoing banner is hidden with the outgoing roster region, so the old word simply disappears). A full text swipe (old word exiting too) was designed and deferred: it would need the outgoing banner kept visible, drawing only its text, above the incoming ribbon.

---

## Character data: classes, tiers and templates

Phase 9 part one made character data real, as pure, read-only TypeScript modules in src/lib/game/. Classes and tiers are **data and display only** for now — they have no gameplay effect. Their future jobs (classes affecting shop slot counts and more; tiers gating which dwarves the shop offers) are not yet specified and must not be invented.

- **Classes** (characterClasses.ts): CHARACTER_CLASS_IDS = ["warrior", "mage", "merchant", "smith", "miner"] as const, CharacterClassId derived from it, and the isCharacterClassId guard. A string-literal union defined once as a list, never a TS enum: readable in code and in saves, the compiler rejects typos, and there are no enum runtime quirks. Ids stay English in code and saves; display names are translations in the characterClass message namespace (en Warrior / Mage / Merchant / Smith / Miner; ja 戦士 / 魔法使い / 商人 / 鍛冶屋 / 鉱夫), because class names are interface labels — unlike character names, which are game data.
- **Tiers** (characterTiers.ts): CHARACTER_TIERS = [1, 2, 3, 4, 5] as const, CharacterTier derived from it, and the isCharacterTier guard — the same pattern as classes.
- **Templates** (characterTemplates.ts): CHARACTER_TEMPLATES, a read-only record keyed by template id, plus findCharacterTemplate (an own-property lookup, so a stored id like "toString" can never resolve to a prototype member) and listCharacterTemplates. A CharacterTemplate holds characterTemplateId, name, tier, characterClassIds (1 to 3) and the starting attack and maxHp; every field is readonly. Templates live in a typed module — not YAML, JSON or the database — so adding a character is still "add an entry", tsc catches typos, and server, client and tests import it with no parser or file I/O. Abilities and armour are deliberately absent until they are specified.
- **Template ids** are lowercase kebab-case (borin, old-khaz). An id that has been used in saves is **never renamed or deleted** — only retired from the shop — because characters keep their characterTemplateId.
- **Data guards.** characterTemplates.test.ts checks every template: key equals id, kebab-case id, valid tier, 1–3 valid and distinct classes, a non-negative integer attack and a positive integer maxHp. They guard hand-written data, so they grow in value as templates are added.
- **The templates are the human's to design.** The module holds one example (Borin: tier 1, warrior, 4 attack, 7 maxHp) as the format. Agents must not add templates.
- **One Character type** (src/lib/game/character.ts, Phase 9 parts 2 and 6): a character is { id, characterTemplateId, name, tier, characterClassIds, attack, hp, maxHp, experience }, used everywhere — camp roster, shop previews, saves, battle and cards. Every character comes from a template. Phase 9 first added these fields as an OwnedCharacter extension of the battle engine's older, smaller Character; two types for one concept made cards treat tier and classes as optional, so part 6 merged them and moved Character out of src/lib/battle/ into the game module, which is its natural home: a character is a game concept that the battle engine uses, not owns. Everything is stored on the character, so it can diverge from its template (renames, gained classes, stat growth — rules unspecified); template edits never reach existing characters. spawnCharacterFromTemplate(characterTemplate, newCharacterId) (its own module) is the only way one is built from a template: hp starts at maxHp and the classes list is copied, never shared with the read-only template. Current hp outside battle is persisted — the health a character takes into its next fight — and today always equals maxHp, because battles write nothing back. The battle engine fights with attack and hp only; tier and classes have no battle effect yet.
- **Card display** (redesigned in Phase 10): CharacterCard borrows a trading-card frame's structure with our own look — a thick border and textured frame (--texture-card-frame), a name bar (name left, tier in Roman numerals right, tierRomanNumeral in src/components/game/characterCardDisplay.ts), the portrait, a class bar (translated classes), an empty text box reserved for future abilities (don't fill it — abilities are unspecified), and a combined stats pill overlapping the text box's corner: ⚔ attack | ❤ current hp on dark halves. The hp number is coloured by the pure hpDisplayTone(hp, maxHp): parchment when equal, red when below ("damaged"), green when above ("buffed" — unreachable while maxHp is a hard ceiling, kept by the human's choice for future effects). The HP bar shows only when showHpBar is set, which ActiveCard sets; the hover-reveal and the compact/full variants are gone. **The card scales as a whole:** its root is a Tailwind @container carrying no container-unit styles (an element can't measure itself), and every size inside the frame is a named cqw token in globals.css's @theme inline (--text-card-_, --spacing-card-_, --radius-card-\*, --border-width-card-frame), so one layout serves a ~100px shop tile and the 288px action card, and the human tunes it in one place. The root's rounded-md matches RosterSlot's card wrapper so corners coincide. Only the portrait image mirrors (facing scaleX wrapper); bars, pill, HP bar and the Downed overlay never do, and the overlay covers the portrait.

- **Card display, Phase 11 changes:** the text box is no longer on the standard card — it's behind a `showTextBox` prop (off by default, kept rather than commented out) because Phase 12's expanded card view brings it back for ability descriptions. The card's bottom row is now a flex row: an optional parchment level pill ("Lv 2" / "Lv2", so it never reads as the Roman-numeral tier) at the left and the stats pill at the right. CharacterCard stays non-interactive; Phase 12's info control must be a sibling of the slot button, never inside it.

---

## Testing

Use **Vitest**. (Background: Rails fuses logic and persistence in the model layer; this stack separates them — so logic is tested in isolation, with no DB.)

- **Bulk of tests = pure-logic unit tests** over the framework-free game-logic modules (battle system, progression, turn resolution). The complex battle system should be covered exhaustively. No DB setup/teardown needed. In particular: `resolveBattle` and `applyEvent` (see "Battle data architecture") are pure and should be tested exhaustively.
- **Smaller set of integration tests** for persistence wiring (Server Actions that load → run logic → save). Either against a real test Postgres (local Docker or the Supabase CLI's local instance, reset between runs) or by mocking the Prisma client.
- Shape is the standard **testing pyramid**: many fast pure-logic tests, fewer integration tests.
- **Do NOT write tests against Supabase itself** — it's infrastructure. Test our own code.
- **Persistence handlers are tested with fake GameRepository implementations** that record calls (no database — Docker isn't available in WSL). Assert on whole mapped lists — expect(recordedCalls.map((recordedCall) => recordedCall.expectedRevision)).toEqual([5]) — never index [0] on a possibly empty list, so a red fails on value instead of throwing a TypeError.
- **Shop randomness is scripted in tests.** src/test/characterShopFixtures.ts provides fixture templates, slot builders (buildOfferingCharacterShopSlot, LOCKED_CHARACTER_SHOP_SLOT, SOLD_CHARACTER_SHOP_SLOT), a fixture shop (buildFixtureCharacterShopSlots) and buildFixtureCharacterShopRollingSources(scriptedIndexes), whose chooseRandomIndex returns the scripted indexes in order (0 once exhausted) and records every option count it was asked for. Tests never depend on the real template module's data, which the human designs.
- **Refactor blocks may skip a value red.** A rename or switch-over that adds no rule (Phase 9 part 4c) can't fail on value against the old code — the rewritten tests crash instead. Such blocks rewrite the tests first with no source change, stop for review of the tests as the spec, then change the code to green. New behaviour still goes red first in its own block.
- **Server Actions are not unit-tested, by design.** They are kept to parse-and-delegate; the parsing helpers and handlers they call are tested. tsc, build and the human's hands-on check cover the wiring.
- **Red first, with a deliberately wrong stub** for new modules (right name and signature, wrong behaviour), and a written prediction of which tests fail and which pass trivially. Because Vitest doesn't type-check, a reshape can lead with test edits (a genuine behavioural red against the old code) and follow with the type and implementation changes.

### Testing components under the locale tree

Any component rendered in a test that calls useTranslations (or any next-intl client hook) must render inside next-intl's provider, or it throws. Use the shared renderWithMessages helper (src/test/), which wraps the component in NextIntlClientProvider with the real en.json and locale="en" and re-exports Testing Library. Because it uses the real messages, a missing translation key fails the test — which is the intended safety.

Navigation is globally mocked in tests. Components using locale-aware navigation (@/i18n/navigation's Link, useRouter, usePathname) can't render in jsdom without a mounted Next App Router context. Rather than mount Next internals, @/i18n/navigation is globally mocked in vitest.setup.ts — navigation is a framework boundary (Next/next-intl own it), not our code to unit-test. A test that needs to assert a navigation call can import the mocked useRouter and check it. Do not remove this mock or replace it with per-test mounting of Next's router context.

Two supporting config facts, both deliberate: vitest.config.ts inlines next-intl (test.server.deps.inline) so Vitest's resolver follows Next 16's package export map for next-intl's internal next/navigation import; and shadcn Select (Radix) renders its closed trigger cleanly in jsdom, so switcher-style tests assert the closed state and do not try to open the dropdown (Radix's portal + jsdom is flaky on open).

### Testing the camp UI

Test interaction **states**, not **styles**. The logic lives in the pure campSelection.ts and is tested exhaustively there; component tests then check that the right state reaches the DOM — data-camp-target-presentation, disabled, aria-pressed, aria-busy — and that clicks submit the right intent (fake actions record Object.fromEntries(formData); clicks via @testing-library/user-event). Do not assert Tailwind class names: they're tuned by eye, so such tests break on every visual tweak without catching anything, and jsdom doesn't load the stylesheet, so computed styles can't be checked either. Real appearance would need screenshot testing in a browser, which agents must not set up. Pointer dragging is not exercised in jsdom; the click tests double as the guard that dnd-kit doesn't swallow clicks. The header's advance button is tested by rendering a screen inside a real GameScreen with the button as its header (renderWithMessages forwards Testing Library's wrapper option) and finding it via [data-phase-advance], since the screens no longer render their own advance buttons.

Phase 11 additions: rerenderCampScreen (in CampScreen.test.tsx) re-renders the same camp with the refreshed props a refresh() would deliver, which is how the roster-animation tests feed a post-intent roster at revision + 1. Keyboard-mode tests drive Shift and Tab with user.keyboard and window blur with fireEvent; the announcer tests use real timers (findByText's 1 s window covers the 300 ms delay). Animation tests assert data-roster-slot-exit-kind and data-experience-beat, and floaters by text — never motion values.

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
- Agents only edit files in the working tree and run npx tsc --noEmit, npm run test:run and npm run build (build runs prisma generate, which only writes local files), each through tee into .agent-output/ (see the reporting rule below; mkdir -p .agent-output is also allowed). Anything that touches the database, version control or dependencies is the human's: git (any command), the Prisma CLI against a database (migrate dev, migrate deploy, db push, migrate reset), the Supabase CLI, and npm install / npm audit. Where a task needs one of these, the instructions name it as a step for the human. Agents also never open or print .env files.
- **Reporting verification output: raw text only, never a summary.** Run every verification command through tee into the gitignored .agent-output/ folder, overwriting the previous file: npx tsc --noEmit 2>&1 | tee .agent-output/tsc.txt, npm run test:run 2>&1 | tee .agent-output/test-run.txt, npm run build 2>&1 | tee .agent-output/build.txt (mkdir -p .agent-output first if it's missing). In the report, paste each file's whole contents verbatim in a code block, under a heading naming the command. Never summarise, trim, paraphrase or restate totals in your own words instead — a prose "matches the prediction exactly" is not a report, even when it's true. Your own commentary goes after the raw output, never in place of it. If an output is too long to paste, say so and name its file; the human attaches the file. This applies at every STOP, red included. Why: a past report claimed a green for code that was never written, and later reports replaced output with summaries; the human reviews the raw text, and the tee files are the evidence when a paste goes missing.
- **Animations: state in React, motion in CSS where possible.** Expose an animation's trigger as a data attribute and put the motion in globals.css (the XP reveal and the XP beat both work this way). Avoid ref-dependent imperative animation (motion's useAnimate with a selector scope): in Phase 11 its scope ref was null in the browser on a merge while every jsdom test passed, even under React.StrictMode, and the cause was never pinned down. Declarative motion components (floaters, exits) are fine.

- Migrations (the human runs them): edit schema.prisma, then npx prisma migrate dev --create-only --name <name> writes the migration SQL without applying it; review the SQL; then npx prisma migrate deploy applies exactly the reviewed file and never offers to reset. migrate dev compares against the hosted database, so any drift or reset prompt is a hard stop — answer no and investigate. A required column with no default needs an empty table; development saves are deleted first (the parsers deliberately have no legacy branches).
- Styling values in globals.css come in two kinds. @theme inline tokens (colours, card cqw sizes, breakpoints) generate utility classes, but their values are baked into those classes, so they can't change at runtime. Values that must switch with a breakpoint, or are read by inline styles and textures through var(), are plain :root variables (shop sizes and slot looks, textures, banner, header divider), and components use Tailwind's var shorthand (w-(--name)). In this Tailwind version (4.3.1) every theme variable is emitted, used or not.
- Actions that keep the player on the same route (camp intents and advance) end with refresh() from next/cache, never with a redirect to the current page. See "Camp: shop, roster and intents" and "Phase transitions: the game frame and the swipe".
- The locale middleware lives in src/proxy.ts, not middleware.ts. Next 16 deprecated the middleware.ts filename convention in favour of proxy.ts; next-intl's createMiddleware works identically under either name. Do not rename it back to middleware.ts to match older next-intl docs — the deprecation warning is Next's, and proxy.ts is the current convention. The proxy composes two steps via src/lib/proxy/createComposedProxy.ts: the Supabase session refresh (src/lib/supabase/refreshSupabaseSession.ts) runs FIRST, then next-intl's routing runs on the same request, and the refresh's cookies and cache headers are copied onto next-intl's response, which is the one returned. The order is load-bearing: the refresh rewrites the request's cookies so this request's server render sees the fresh token, and next-intl forwards the request headers as they stand when it runs. Reversing it causes double refreshes and random sign-outs. Test (h) in createComposedProxy.test.ts guards the framework behaviour this relies on — if it fails after a Next or next-intl upgrade, redesign rather than patch. The proxy must stay refresh-only: no sign-in, no redirects, no route protection.

---

## Permanently out of scope

- **Live/real-time multiplayer of any kind** — no matchmaking sessions, no synchronous play, no WebSockets/sockets anywhere. Excluded by design, not deferred. PvP is handled via roster snapshots (see above).

---

## Known non-issues (don't chase these)

A globals.css edit sometimes doesn't show in the dev server. Turbopack's persistent dev cache served stale theme changes across restarts, so it is disabled (experimental.turbopackFileSystemCacheForDev: false in next.config.ts; the cost is a slower first compile after a restart). Separately, Tailwind with Turbopack can occasionally serve the CSS one save behind: if a new globals.css variable shows as undefined in the browser, save the file again or restart the dev server. Deleting .next should no longer be needed.

removeChild ... not a child of this node when a browser translation extension is active. Running Google Translate (or similar) on top of the app can throw this React error, most visibly around the locale switcher's dropdown. It is a dev-environment / browser-extension artifact, not a code defect: the extension mutates the DOM outside React's knowledge, so React later fails to remove a node the extension already moved. It does not reproduce in a production build with the extension off. Do not "fix" this by adding translate="no"/notranslate or contorting components — suppressing translation tooling on an intentionally multilingual app is the wrong trade. Left as-is by design.

schema "pg_pgrst_no_exposed_schemas" does not exist (SQLSTATE 3F000) in the Supabase logs. This is PostgREST log noise caused by the Data API being deliberately disabled — Supabase does not fully shut PostgREST down and points it at a placeholder schema that doesn't exist. Supabase documents it as harmless. A SQL workaround exists, but it adds another hand-applied database setting outside the repo that must be undone before re-enabling the Data API, so it is deliberately not applied.

---

## Game logic — not yet specified

The following are intentionally undefined and **must not be invented**. When defined, document them (in the README roadmap and/or here) and implement them as pure, Vitest-tested TypeScript modules per the rules above.

**Defined (do not re-invent — see above):**

- Fundamental battle system: turn structure, simultaneity, drop/shuffle, win/loss/draw (`README.md` → "Battle system").
- Battle data architecture: event stream, `applyEvent`, resolve-once/replay-many, trigger points, animation beats (this file → "Battle data architecture").
- `maxHp`: character stat ceiling — clamped only by the resolver, never by `applyEvent` (this file → "Battle data architecture" → "Character stat ceilings").
- Persistence & save model: the User/Game schema shape, the two-phase (campPhase/battlePhase) machine, and the run-state fields (playerRoster as the 7-slot camp roster, characterShopSlots, gold, day, phase, plus the revision counter) — this file → "Persistence & save model". Note: the save container is defined; the game systems below are not.
- New game starting state: createNewGameState (src/lib/game/) returns seven empty camp slots, a freshly rolled character shop, 10 gold, day 1, campPhase (decided 13 Oct 2026; camp slots added in Phase 8, the shop in Phase 9).
- Basic camp rules (decided 25–26 Oct 2026, shop revised in Phase 9 — this file → "Camp: shop, roster and intents"): the roster has 7 slots; gaps are allowed in camp and squeezed out at battle start. Buying takes the character offered in a character shop slot and must target an empty roster slot; the slot is then sold until the next camp. Moving onto an empty slot moves; moving onto an occupied slot swaps; moving to the same slot is rejected. At the start of every camp, gold is set (not added) to 10 — unspent gold is lost. An empty roster fights and loses instantly (resolveBattle ends with enemyWin; pinned by resolveCampBattle's tests). Merging and selling are defined in Phase 11 (next bullet).
- Character shop (Phase 9, decided 8–9 Nov 2026): the shop has dedicated sections, and the character section is the only one built. It has 8 slots, 3 open and 5 locked at the start of a run; each open slot offers a template chosen uniformly at random (duplicates allowed); every open slot re-rolls at the start of every camp, including a new game's first, keeping the open-slot count; a flat 3 gold per character regardless of tier. Locked slots offer nothing. Open-slot growth is unspecified. Equipment, magic and food sections (4, 4 and 2 slots) are shown, all locked, as display-only placeholders (Phase 10); their rules are unspecified.
- Battles in the run (Phase 8 part two): every battlePhase fights the saved camp roster, squeezed into a gapless line, against a placeholder enemy (since Phase 9: a single Borin spawned from the borin template). Battles still have no persistent consequence.
- Character data (Phase 9 part one, decided 8 Nov 2026): five character classes, tiers 1–5 and character templates as typed read-only modules — this file → "Character data: classes, tiers and templates". Classes and tiers have no gameplay effect yet.

- Experience, levels, merging and selling (Phase 11, decided 15 Nov 2026 — this file → "Camp: shop, roster and intents" → "Experience, merging and selling"): XP from merging a matching character (merge-buy gives 1, roster merge the consumed dwarf's XP + 1), +1 attack / +1 max hp / +1 current hp per point, levels at 3 / 6 / 10 / 15 XP, max level 5 (not a merge target; overflow caps at 15), the survivor keeps slot, id and name; selling empties the slot for a flat 1 gold, the last dwarf may be sold, no confirmation. Levels have no effect yet.

**Still undefined:**

- [ ] Card model and card types
- [~] Character stats and progression / leveling rules — experience and levels are defined (Phase 11); what levels _do_ waits for abilities (Phase 12) (`maxHp` is now defined — see "Battle data architecture" → "Character stat ceilings")
- [~] Roster construction and constraints (shopping phase): the basic camp rules above are defined. Still undefined: shop stock, rerolls and tiers; per-turn income beyond the start-of-camp reset. (Merging — "promotion" — and selling were defined in Phase 11.)
- [ ] Character abilities and triggered effects (the listeners at the trigger points)
- [ ] Enemy generation: PvE opponents and PvP roster snapshots (a single placeholder enemy stands in — see "Persistence & save model" → save flow)
- [ ] Battle consequences: game over on loss, rewards on win (future seams on advanceGame's battlePhase → campPhase transition)
- [~] Data model (Prisma schema): the User/Game save container is defined (see "Persistence & save model"); the schema for the game systems below (cards, progression, abilities) remains undefined.
