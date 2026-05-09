# AI Memory & Runtime Baseline - LelitDistrikt2

> This is the canonical reference for the AI stack, active services, and current implementation status.
> For the logical architecture of the memory system, see [moirai-continuity-specification.md](moirai-continuity-specification.md).
> Last updated: May 8, 2026.

---

## 1. Runtime Baseline & Active Services

### Active Services and Storage

| Service | Endpoint | Port | Status |
| --- | --- | --- | --- |
| Ollama Chat | `/v1/chat/completions` | `11434` | Active runtime path |
| Ollama Discovery | `/v1/models` | `11434` | Active runtime path |
| Shared Canonical SQLite Persistence | `%LOCALAPPDATA%/LelitDistrikt2/MoiraiData/ConversationMemory.db` | N/A | Shared by UE runtime and Moirai Studio |

### Core Runtime Components

- **`UPlayerConversationComponent`**: Primary runtime owner on the Player Controller. Manages chat lifecycle, local memory access, transcript filtering, and repair retries.
- **`UConversationIdentityComponent`**: NPC-side component defining persona and identity for the AI system.
- **`UMoiraiContinuitySubsystem`**: Global system authority for time, continuity synthesis, and inter-character memory propagation.
- **Moirai Studio Pro**: Standalone administration tool for monitoring and moderation.
- **`tools/wipe_moirai_db.py`**: Local reset utility for clearing test transcripts, summaries, memories, actions, and propagation state while preserving schema and actor identities.

---

## 2. Implementation Status (May 2026)

The Moirai Engine is partially implemented. The canonical specification remains the target architecture, not a claim of full completion.

### Current Stable Features

- [x] **Ollama Runtime Path:** Unreal talks directly to Ollama-compatible `/v1/chat/completions` and `/v1/models`.
- [x] **Temporal Chaining:** Canonical writes populate `PreviousMemoryId`.
- [x] **Atomic Propagation Writes:** NPC exchanges write `MemoryRecord`, `PropagationEvent`, and `NpcInteractionRecord` in a single transaction.
- [x] **Shared DB Monitoring:** Lelit runtime writes and Moirai Studio archive views observe the same canonical DB records.
- [x] **Propagation Loop Suppression:** Social actions are blocked for existing hearsay unless directly implicated.
- [x] **Propagation Depth Cap:** Hard limit of 2 social hops implemented via `MutationCount`.
- [x] **Selective Propagation:** Scored propagation based on relationship, relevance, and emotional weight (15 event cap/cycle).
- [x] **Recall Filtering:** Human-like recall layer introducing local rumor phrasing, hesitation for uncertainty, and vagueness for old facts.
- [x] **Prompt Budgeting:** Bucketed retrieval (Recent, Stable, Social, Emotional) with hard caps to prevent context sprawl.
- [x] **Speech Policy Layer:** Explicit LLM instructions for treating lived experiences vs. social rumors vs. faded impressions.
- [x] **Safety Hardening:** Terminology-neutral labels (e.g., 'Insights', 'Rumors', 'Directives') to bypass LLM privacy triggers.
- [x] **Launcher Resilience:** Fixed backend syntax and indentation errors causing `launch_local_ai_stack.bat` failures.
- [x] **Action Lifecycle Enforcement:** Strict trigger windows, cooldowns, and automatic expiration for NPC goals.
- [x] **Standardized Identity:** Runtime and Studio operate on uniform `NPC1` - `NPC6` actor IDs.
- [x] **Mutation Tracking:** Propagated memories preserve `MutationCount` and `OriginalSummaryText`.
- [x] **Relay Privacy Sanitization:** Autonomous social actions strip private clauses before propagation and interaction synthesis.
- [x] **Read-Only Studio Monitoring:** Archive and interaction reads no longer execute pending autonomous actions during UI polling.
- [x] **Studio Identity Schema Compatibility:** `ConversationActors` includes structured identity fields.
- [x] **Dialogue Sanitization Before Persistence:** Assistant turns are cleaned before being saved.
- [x] **One-Step Dialogue Repair:** Bad assistant drafts can trigger a repair pass.

### In Progress / Not Yet Trustworthy

- [x] **Persistence Path Convergence:** Runtime and Studio now target one canonical DB path under `%LOCALAPPDATA%`.
- [~] **Concurrent Runtime/Studio Validation:** Shared-path layout is in place, but broader soak testing is still pending.
- [~] **Live UI-to-UI Validation:** DB-backed propagation is verified, but a clean "start in Lelit UI, watch live in Moirai UI" pass is still pending under stable Ollama response times.

### Verified On May 7, 2026

- A marked NPC1 conversation produced `ConversationTurn`, `MemoryRecord`, `ActionRecord`, `PropagationEvent`, and `NpcInteractionRecord` rows in the canonical DB.
- Those rows were visible to Moirai Studio because Studio and Unreal were attached to the same `%LOCALAPPDATA%` database.
- Before the fix, private content leaked into propagated action summaries and NPC-to-NPC interaction summaries.
- After the fix, the private clause remained only as NPC1 private memory and no longer appeared in propagated actions, interactions, or recipient memories.

### Known Failures

- **Studio chat timeout:** `POST /api/chat` can still fail with an Ollama read timeout after `60s`.
- **Slow maintenance/extraction:** `POST /api/conversations/{actor_id}/end` succeeded in testing, but worst-case latency was multiple minutes.
- **Launcher/process fragility:** Detached Studio backend launches were inconsistent from automation. The visible batch launcher path is currently more reliable.

### Resolved On May 8, 2026

- **Unreal SQLite startup regression:** The live canonical DB became Unreal-incompatible after Python-side rewrites even when logical validation passed in Python. The stable fix was to quarantine the Python-touched canonical DB, let Unreal recreate the live DB with its own SQLite runtime, and keep Python tools limited to snapshot/export/quarantine workflows rather than mutating the live runtime DB.
- **Legacy Auggie alias regression:** The runtime now canonicalizes the legacy `auggie` alias to `NPC1` at the identity source, and fresh DB writes were verified to persist `NPC1` consistently in `ConversationActors`, `Conversations`, and `ConversationTurns`.

### Runtime Conversation Hardening

The interaction layer is hardened against reasoning leakage and transcript poisoning:

- **Prompt structure:** Runtime prompts include durable memory, pending actions, and recent transcript context.
- **Extraction layer:** Assistant output is scrubbed before UI display and before transcript persistence.
- **Repair pass:** If the primary generation looks like reasoning or meta text, runtime issues one repair request for spoken dialogue only.
- **Maintenance guardrails:** Memory maintenance only reads authoritative transcript rows and uses a stricter prompt focused on durable, transcript-grounded facts.

---

## 3. Administrative Interface: Moirai Studio Pro

Moirai Studio Pro is the administration suite for managing the simulation's cognitive state.

- **The Sanctum:** Telemetry dashboard for DB and AI health.
- **Subject Weaver:** Real-time identity and persona editing.
- **The Oracle:** Consultation view with context visualization.
- **The Archives:** Moderation grid for transcripts, summaries, memories, and actions.

### Subject Weaver: Current Editing Flow

- Each Subject card in the `Subjects` registry exposes an explicit `Edit Subject` action.
- Clicking `Edit Subject` opens a dedicated modal editor.
- The editor is tabbed into `Core Description`, `Speaking Style`, `Personality`, and `State of Mind`.
- Personality sliders and emotion controls are not cosmetic; they compile into the canonical identity record for the NPC.
- Studio writes the structured fields back into `ConversationActors`, generates a `CanonicalDescription`, and compiles the definitive runtime `SystemPrompt`.
- The Studio chat path consumes that compiled `SystemPrompt`, so Subject edits directly affect Studio-side NPC behavior.

---

## 4. Operational Notes

- **Live runtime chat:** Unreal uses Ollama directly. The FastAPI backend is not on the critical path for in-game chat.
- **Studio chat:** The FastAPI backend still provides the browser-based Studio chat and archive workflows.
- **DB health check:** Run `python tools/validate_moirai_db.py` before blaming Ollama or UI code. This validates canonical-path presence, schema shape, legacy-table contamination, and basic SQLite integrity.
- **DB rebuild path:** If Unreal can chat but cannot attach persistent memory, rebuild the canonical DB into a fresh file with `python tools/rebuild_moirai_db.py`. This reconstructs the DB logically instead of byte-copying the failing file.
- **Compatibility-first reset path:** If rebuild still leaves Unreal in stateless mode, run `python tools/preserve_and_reset_moirai_db.py`. This exports a JSON snapshot of the canonical DB, quarantines the current SQLite file, and leaves Unreal free to generate a brand-new canonical DB on next launch using its own SQLite runtime.
- **Live DB rule:** Do not use Python write utilities against the live canonical DB that Unreal is actively using. Use Python for snapshots, exports, validation, and quarantine workflows; let Unreal remain the writer/creator of the active runtime DB.
- **Alias normalization path:** `python tools/normalize_moirai_actor_aliases.py` exists for one-off cleanup of legacy rows, but with the runtime identity patch compiled it should not be part of normal operation.
- **Reset workflow:** For test cleanup, run `python tools/wipe_moirai_db.py`.
- **Full rebuild workflow:** If the test DB is disposable, delete `%LOCALAPPDATA%/LelitDistrikt2/MoiraiData/ConversationMemory.db` and recreate it from the canonical schema in `tools/migrate_legacy_moirai_to_canonical.py`.
- **Legacy paths:** `Saved/ConversationMemory.db` and `Saved/MoiraiData/ConversationMemory.db` are no longer valid runtime or Studio targets.

---

## 5. NPC Social Circle (Group a)

| ID | Name | Role/Identity |
| --- | --- | --- |
| **NPC1** | **Auggie** | The Philosopher / Guide |
| **NPC2** | **The Archivist** | Keeper of Records / Measured |
| **NPC3** | **The Mechanic** | Infrastructure / Practical |
| **NPC4** | **The Gardener** | Synthetic Greenery / Patient |
| **NPC5** | **The Merchant** | Gossip & Trade / Charismatic |
| **NPC6** | **The Wanderer** | Edges & Riddles / Ethereal |
