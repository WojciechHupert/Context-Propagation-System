# Moirai Continuity Engine Specification

> Status: active specification plus current-state notes
> Last updated: May 7, 2026

## 1. Executive Summary

The Moirai Continuity Engine is the cognitive backbone of Lelit Distrikt 2. It governs persistence, evolution, and social transfer of information across the NPC population. The target design treats memories as dynamic, traceable records rather than simple quest flags.

This document describes both the intended architecture and the current operational constraints where they materially differ.

## 2. Core Pillars of Continuity

### 2.1 Temporal Chaining

Every memory unit is part of a larger narrative thread.

- **Mechanism:** `MemoryRecords` include `PreviousMemoryId`.
- **Logic:** When a new fact is synthesized, the engine can link it to the most recent owned memory for that NPC.
- **Utility:** This allows NPCs and Studio tooling to reconstruct a coherent continuity trail.

### 2.2 Associative Routing

Information spreads through social and semantic resonance rather than random broadcast.

- **Group-first rule:** Memories prefer propagation between NPCs sharing `ShareGroupName`.
- **Secondary resonance rule:** Tags and narrative networks provide a fallback resonance path.
- **Recipient ownership:** Propagation creates a new recipient-owned record while preserving a source link through `SourceMemoryId`.

### 2.3 Mutation Tracking

As information travels, the system preserves a trail of drift.

- **Mutation tracking:** Propagated memories preserve `MutationCount` and `OriginalSummaryText`.
- **Confidence drift:** Confidence can degrade through propagation and recall behavior.
- **Audit visibility:** Studio can inspect drift over time through transcript, summary, and memory records.

## 3. Data Infrastructure

### 3.1 Persistence Layer

- **Storage:** SQLite 3
- **Shared canonical path:** `%LOCALAPPDATA%/LelitDistrikt2/MoiraiData/ConversationMemory.db`
- **Legacy paths not supported:** `Saved/ConversationMemory.db`, `Saved/MoiraiData/ConversationMemory.db`
- **Current reality:** Runtime and Studio are intended to open and validate the same canonical schema from first boot.

### 3.2 Canonical Schema

The active schema includes at least these major tables:

- `ConversationActors`
- `Conversations`
- `ConversationTurns`
- `ConversationSummaries`
- `MemoryRecords`
- `MemoryFacts`
- `MemoryShares`
- `ActionRecords`
- `PropagationEvents`
- `RuntimeControlState`
- `NpcInteractionRecords`

### 3.3 Authoritative Transcript Rule

Not every stored assistant line should be treated as real conversational history.

- **Authoritative rows:** Normal user turns and clean assistant dialogue.
- **Non-authoritative rows:** Fallback, error, and meta channel types such as `game_fallback`.
- **Operational rule:** Prompt replay and memory maintenance must ignore non-authoritative transcript rows.

## 4. Operational Workflows

### 4.1 Live Unreal Conversation

The in-game conversation path is owned by `UPlayerConversationComponent`.

1. Save the user turn.
2. Load durable memory context, shared hearsay, pending actions, and recent authoritative transcript context.
3. Send a live prompt to Ollama-compatible chat.
4. Extract spoken dialogue from the model output.
5. Persist only sanitized assistant dialogue.
6. Trigger maintenance after enough authoritative turns accumulate.

### 4.2 Dialogue Repair

If the primary model output is empty, low quality, or looks like reasoning or meta text:

- Runtime performs one additional low-temperature repair pass.
- The repair pass asks for final spoken dialogue only.
- If repair still fails, runtime emits a generic fallback reply and tags it as non-authoritative.

### 4.3 Memory Maintenance

The runtime maintenance pass is a secondary LLM request operating on recent authoritative transcript context.

- **Trigger:** Turn threshold or session boundary.
- **Focus:** Durable, transcript-grounded facts, explicit preferences, relationship changes, commitments, and follow-up actions.
- **Guardrail:** Do not store assistant style notes, chain-of-thought, or speculative world facts.

### 4.4 Moirai Studio Pro

The Studio backend and frontend provide:

- Archive inspection
- Subject identity editing
- Studio-side chat
- Manual transcript and memory moderation

The Studio is not currently the primary in-game chat execution path.

### 4.5 Verified Propagation Path

The currently verified operational path is:

1. Lelit writes player-facing conversation turns into the canonical DB.
2. Moirai extraction creates private memories and social action candidates from those turns.
3. Eligible social actions create `ActionRecords`.
4. Immediate autonomous execution creates `NpcInteractionRecords`, recipient-owned `MemoryRecords`, and `PropagationEvents`.
5. Moirai Studio reads those same records from the shared canonical DB for archive and interaction monitoring.

This path was verified against the canonical database on May 7, 2026.

### 4.6 Known Operational Constraints

- **Privacy leak fixed:** Social action synthesis previously allowed private clauses to bleed into propagated action text and NPC interaction summaries. Relay sanitization now strips those clauses before social propagation.
- **Read-path mutation fixed:** Studio archive and interaction polling previously called the autonomous executor on read, which could cause extra NPC-to-NPC propagation just by monitoring the system. Those endpoints are now intended to be read-only.
- **Chat path instability remains:** Studio-side `/api/chat` can still time out against Ollama. Extraction and propagation verification should not rely solely on the Studio chat route until that timeout issue is resolved.

## 5. Implementation Guidelines

- **NPC IDs:** Use standardized IDs such as `NPC1` to `NPC6`.
- **Dialogue extraction:** Assistant outputs must be filtered before both UI display and transcript persistence.
- **Transcript hygiene:** Non-authoritative fallback and error rows must not be replayed as active context.
- **Maintenance discipline:** Only grounded transcript content should become durable memory or actions.
- **Reset workflow:** Test data can be cleared with `python tools/wipe_moirai_db.py`.
- **Full rebuild workflow:** If test data is disposable, the canonical DB can be deleted and rebuilt from the shared schema in `tools/migrate_legacy_moirai_to_canonical.py`.
