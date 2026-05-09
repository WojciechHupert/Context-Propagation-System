# AI Memory Integration Plan (Moirai)

> STATUS: CORE BASELINE STABILIZED, NOT FEATURE-COMPLETE (MAY 6, 2026).
>
> This document tracks the evolution of the runtime memory baseline from simple storage to the full Moirai Continuity Engine.

---

## Phase 1: Action Records (COMPLETED)
**Goal:** Allow NPCs to "remember to follow up" on a conversation.
- [x] Schema implementation for `ActionRecords`.
- [x] LLM extraction of structured future intents.
- [x] Retrieval injection into live prompt context.

---

## Phase 2: Canonical Propagation (COMPLETED)
**Goal:** Replace legacy hearsay with traceable social propagation.
- [x] `PropagationEvents` table implementation.
- [x] Recipient-owned `MemoryRecord` generation with `SourceMemoryId` linkage.
- [x] **Associative Routing Baseline:** Propagation now uses shared groups plus secondary tag/network resonance.
- [x] **Selective Eligibility Scoring:** Propagation is now scored (relationship/relevance) and capped (10 events/cycle).
- [x] **Social Drift:** Memories "drift" (mutate) automatically as they spread between NPCs.

---

## Phase 3: The Moirai Continuity Subsystem (STABILIZED)
**Goal:** Global state authority for elapsed time and continuity.
- [x] `UMoiraiContinuitySubsystem` ownership of synthesis logic.
- [x] **Temporal Chaining:** Chronological linking of memory units via `PreviousMemoryId`.
- [x] **Mutation tracking:** Explicit tracking of "Memory Flux" and "Drift" through mutation counts and original fact preservation.
- [x] Scheduled synthesis now reopens the canonical DB per provider instead of reusing a live component-owned handle.

---

## Phase 4: Moirai Studio Pro (STABILIZED)
**Goal:** Professional administration and moderation environment.
- [x] Overhaul to **IDE-style Master-Detail layout**.
- [x] **Neural Vitals:** Oracle visualization of temporal chains and active context.
- [x] **Flux Tracking:** Archives moderation grid with mutation auditing.
- [~] **Shared Canonical DB Goal:** Studio and runtime are intended to converge on one DB path, but the current runtime and Studio paths are still partially diverged.
- [x] **Canonical Memory Writes:** Studio memory creation and auto-archiving now preserve chaining/source metadata.
- [ ] Full concurrency soak testing between Studio and runtime.

---

## Phase 4.5: Runtime Conversation Hardening (COMPLETED)
**Goal:** Prevent active-chat context poisoning and low-quality transcript reuse.
- [x] Assistant dialogue is sanitized before persistence.
- [x] Non-authoritative transcript rows are excluded from prompt replay and maintenance.
- [x] One-step repair retry for unusable assistant drafts.
- [x] Test reset utility added at `tools/wipe_moirai_db.py`.

---

## Phase 6: Memory Refinement & Human Recall (COMPLETED)
**Goal:** Implement imperfect, selective, and perspective-bound NPC recall.
- [x] **Recall Filter Layer:** Introduces local rumor phrasing, hesitation, and age-based vagueness.
- [x] **Retrieval Bucketing:** Memory retrieval is categorized (Recent, Stable, Social, Emotional) with hard prompt caps.
- [x] **Safety Hardening:** Terminology transition to narrative labels ("Your Experiences", "Local Rumors & News") to bypass LLM privacy triggers.
- [x] **Speech Policy Layer:** Explicit LLM permissions for memory verbalization (e.g., "must attribute", "must hedge").
- [x] **Action Lifecycle:** Intent management with trigger windows, cooldowns, and automatic expiration.

---

## Phase 7: Studio Observability Upgrade (COMPLETED)
**Goal:** Deep inspection of the memory pipeline and propagation chain.
- [x] **Source & Privacy Badges:** Visual indicators for memory origin and visibility.
- [x] **Mutation Visualization:** Hop counters and "Memory Weave" auditing.
- [x] **Propagation Trace:** Backend and frontend support for tracing information spread across NPCs.
- [x] **Refined Inspector:** Comprehensive memory editor for all 11 new metadata fields.

---

## Phase 8: World reaction layer (PLANNED)
**Goal:** Memory-driven environment and schedule shifts.
- [ ] Direct coupling between memory state and MassAI StateTrees.
- [ ] World-level triggers (seasonal shifts, door locks, shop availability) driven by Moirai continuity.
