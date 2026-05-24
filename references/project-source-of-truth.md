# CPS Project Source Of Truth

CPS is an exploratory infrastructure for social memory: a prototype for worlds where information has consequences. It is the primary system and research direction behind this project. Lelit Distrikt is one bounded visual endpoint for experiencing that system, while CPS Studio is the proof and inspection surface used to verify how memory behaves.

The current focus is not a full society simulator, a general life simulator, or a validated scientific simulation. CPS is an instrument-like prototype for exploring open-ended information flow inside artificial social environments: how information propagates, mutates, is contained, retains lineage, and can later be recalled with consequences.

## Core Pillars
- **Persistence:** Every memory is a durable record in a shared database.
- **Propagation:** Information travels naturally between characters based on social ties.
- **Continuity:** The system maintains a consistent timeline across sessions.

The current technical work on lineage, duplicate suppression, private-memory blocking, and propagation depth is not incidental implementation detail. These mechanisms form the early grammar of social memory inside CPS.

> Last updated: May 10, 2026.
>
> This is the primary canonical document for project state, feature status, roadmap direction, and marketing-safe claims.

## What This Prototype Is

CPS is open-ended in the sense that information can continue to propagate, mutate, be contained, and be recalled over time. It is bounded in the sense that the current prototype uses controlled agents, defined scenarios, explicit propagation rules, and inspectable state.

Lelit Distrikt is the current visual runtime endpoint: a localized Mediterranean setting where a small cast can demonstrate how CPS handles memory, retelling, and consequence. The focus is on observation, conversation, and inspectable continuity, not on proving a living world.

---

## Current Product Baseline (May 2026)

- **Engine:** Unreal Engine `5.7`.
- **Primary Runtime Inference Path:** Local Ollama-compatible chat on `http://127.0.0.1:11434/v1/chat/completions`.
- **Runtime Conversation Layer:** `UPlayerConversationComponent` owns live NPC chat, transcript replay, repair retries, and maintenance triggering.
- **Memory Infrastructure:** UE runtime and CPS Studio share `%LOCALAPPDATA%/LelitDistrikt2/MoiraiData/ConversationMemory.db`.
- **NPC Social Circle:** Standardized IDs `NPC1` - `NPC6`.
- **Administration:** **CPS Studio** (Desktop proof surface) and **Moirai Website** (Public observation layer) for archive inspection, persona editing, and Studio-side chat.
- **Website Structure:** 
    - `index.html`: Clean high-level vision and origin.
    - `how-does-it-work.html`: Public explanation of CPS mechanics.
    - `use-cases.html`: Public CPS use-case framing.
- **Deployment:** Live on GitHub Pages at `https://WojciechHupert.github.io/Moirai_Website/`.

---

## Active Features (Current Stable Baseline)

### 1. The CPS Memory Engine

The CPS memory engine is the core mechanism behind the current demonstrator. It governs persistence, evolution, containment, and social transfer of information across the NPC population. The target design treats memories as dynamic, traceable records rather than simple quest flags or disposable chat history.

- **Temporal Chaining:** Chronological linking of memories via `PreviousMemoryId`.
- **Associative Routing:** Propagation prefers shared groups first, with secondary tag and network resonance.
- **Cognitive Drift Tracking:** Mutation counts and original fact preservation are persisted for propagated memories.
- **Factual Synthesis:** Runtime maintenance extracts structured memories and actions with enriched metadata (Confidence, Privacy, Stability).
- **Human Recall Filter:** NPCs now exhibit imperfect recall, local rumor phrasing, and age-based vagueness.
- **Selective Propagation:** Atomic social spread (linked Memory/Event/Interaction writes) scored by relationship and relevance, with hard depth caps (max 2 hops) and mutation (drift) counters.
- **Prompt Budgeting:** Balanced retrieval of recent, stable, and social memories within hard token/count caps.
- **Safety Hardening:** Use of narrative-first labels ("Your Experiences", "Local Rumors & News") to bypass LLM safety filters.
- **Action Lifecycle:** Intent management with trigger windows and cooldowns to prevent stale repetition.
- **Verified Shared Monitoring:** Lelit can originate continuity records and CPS Studio can inspect those same records from the shared canonical DB.
- **Conceptual Meaning:** Lineage is how CPS knows where information came from. Duplicate suppression prevents repeated retelling from corrupting shared memory state. Private-memory blocking models containment. Propagation depth controls how far information is currently allowed to travel through the proof loop.
- **Full Spec:** See [moirai-continuity-specification.md](moirai-continuity-specification.md).

### 2. Runtime Conversation Hardening

The live Unreal conversation path now includes:

- **Assistant-output sanitization before persistence**
- **Transcript authority filtering**
- **A one-step repair request for unusable model drafts**
- **Tagged fallback replies that do not re-enter authoritative context**
- **Stricter maintenance prompts that prefer durable, transcript-grounded facts**

These protections were added because earlier test transcripts showed reasoning leakage and transcript poisoning.

### 3. CPS Studio

A standalone proof and inspection environment for monitoring and shaping system state.

- **Sanctum:** Health and telemetry.
- **Subject Weaver:** Schema-backed identity editing with prompt compilation.
- **Oracle:** Context inspection and Studio-side chat tooling.
- **Archives:** Moderation views for transcripts, summaries, memories, and actions.

### 4. Local Reset Workflow

Test data can now be cleared locally with:

```bash
python tools/wipe_moirai_db.py
```

This clears transcripts, summaries, memories, actions, and propagation records while keeping schema and actor identities intact.

If the test DB itself is disposable, the canonical database can also be deleted and rebuilt from the shared schema in `tools/migrate_legacy_moirai_to_canonical.py`.

---

## Immediate Priorities

1. **Studio chat stability:** Fix Ollama timeout behavior on the Studio `/api/chat` route.
2. **Maintenance latency:** Reduce `/api/conversations/{actor_id}/end` latency so extraction and propagation complete fast enough for live validation.
3. **Concurrent validation:** Soak test shared runtime/Studio access against the canonical `%LOCALAPPDATA%` DB.
4. **Behavioral coupling:** Deepen the link between CPS memory state and NPC world behaviors.
5. **Observability hardening:** Improve diagnostics around SQLite startup failures and background continuity access.
6. **Operational recovery path:** Keep `tools/validate_moirai_db.py`, `tools/export_moirai_snapshot.py`, and `tools/preserve_and_reset_moirai_db.py` as the standard offline safety path for the shared DB.

---

## Verified Limitations

- A private-to-public separation bug existed in propagation and was fixed on May 7, 2026.
- Moirai monitoring previously had a side effect: reading archives/interactions could execute pending NPC actions. That behavior was fixed and should not be treated as acceptable baseline behavior.
- The shared DB path is validated, and the May 8, 2026 recovery confirmed that Lelit and Moirai Studio can again share one canonical `%LOCALAPPDATA%` DB when Unreal owns creation of the live file.
- The runtime still labels persistent-memory loss explicitly as stateless chat, which should remain as a guardrail even though the primary SQLite startup issue is resolved.

These constraints matter conceptually as well as operationally. The goal of the current demonstrator is not to prove a full social world, but to prove that social memory can be created, moved, constrained, inspected, and recalled through CPS.

---

## NPC Social Circle (Interactive NPCs)

| ActorId | Display Name | Archetype |
| --- | --- | --- |
| **NPC1** | **Auggie** | The Philosopher / Guide |
| **NPC2** | **The Archivist** | Librarian of District 2 |
| **NPC3** | **The Mechanic** | Infrastructure & Grime |
| **NPC4** | **The Gardener** | Synthetic Life Tender |
| **NPC5** | **The Merchant** | Gossip & Exchange |
| **NPC6** | **The Wanderer** | Enigma of the Edges |

---

## Source Hierarchy

1. `project-source-of-truth.md` (this file)
2. `ai-memory-and-runtime.md` (actual runtime and service baseline)
3. `moirai-continuity-specification.md` (core logic specification and target architecture)

Conceptually, the hierarchy is:

1. **CPS** is the primary system and source of meaning for memory propagation logic.
2. **CPS Studio** is the proof and inspection surface for verifying state and behavior.
3. **Lelit Distrikt / Unreal** is one visual runtime endpoint, not the authority over memory meaning or propagation semantics.
