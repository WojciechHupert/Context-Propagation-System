# AI Memory: Human Behavior & Controlled Propagation

> This document defines the design philosophy and technical extensions for humanizing the Lelit Distrikt 2 AI memory system. It extends the canonical Moirai architecture defined in `ai-memory-and-runtime.md`.

---

## 1. Updated Architecture Section

### Dual-Layer Memory Model
The architecture enforces a strict separation between what the system knows and what the character recalls.

*   **System Memory (Moirai):** The canonical database. It is accurate, structured, append-only, and never destructively edited. It contains the full truth and the complete source chain of how information was acquired.
*   **Character Memory (NPC Recall Layer):** Generated at retrieval time. It is imperfect, selective, and emotional. Characters may forget, distort, or hesitate based on their current state and relationship to the information. This layer is an active filter, not stored data.

> **Rule:** Moirai remembers accurately; NPCs remember humanly.

### AI Responsibility Boundaries
*   **AI IS:** The interpreter. It handles extraction of transcripts into records, classification of those records, propagation summarization, and recall interpretation (applying the recall filter).
*   **AI IS NOT:** The source of truth. It cannot create hidden state outside the SQLite database and cannot rewrite the canonical Moirai history.

> **Rule:** AI is the interpreter, not the database.

---

## 2. Implemented Schema Extensions

To support human-like recall and controlled propagation, the `MemoryRecords` and `ActionRecords` tables include the following classification fields:

**MemoryRecords Extensions:**
*   `ConfidenceLevel` (String): e.g., 'uncertain', 'likely', 'confirmed'. Extracted by LLM.
*   `PrivacyLevel` (String): e.g., 'private', 'shareable', 'public'. Controls propagation eligibility.
*   `EmotionalWeight` (Float): Visualized in Studio; affects recall filter emphasis.
*   `RecallStability` (String): e.g., 'stable', 'degradable', 'fragile'. Affects forgetting/vagueness.
*   `DistortionRisk` (String): e.g., 'low', 'medium', 'high'. Affects phrasing mutation during recall.
*   `SourceKind` (String): e.g., 'direct', 'propagated', 'observed'.
*   `SourceNPCId` (String): Attribution for social reports (hearsay).

**ActionRecords Extensions:**
*   `ActionState` (String): Lifecycle is strictly `pending` -> `triggered` -> `used` -> `expired`.
*   `TriggerWindowStart/End` (DATETIME): Temporal constraints for intent.
*   `CooldownUntil` (DATETIME): Prevents repetitive follow-up hooks.

*Note: Extraction prompts are updated to output these structured classifications instead of simple summaries.*

---

## 3. Runtime Flow Update

The lifecycle of a conversation and its memory follows this explicit path:

1.  **Conversation:** The player interacts with a Group (a) NPC via the local LLM.
2.  **Extraction:** The conversation ends. Moirai prompts the LLM to extract structured `MemoryRecords` (with new classification fields) and `ActionRecords`.
3.  **Storage:** Moirai saves these records to SQLite in append-only fashion.
4.  **Action Interpretation:** Pending actions are evaluated against time. If their window passes without triggering, they expire or convert to past reflections.
5.  **Propagation:** During the On-Load Continuity Synthesis phase, Moirai evaluates `shareable` and `public` memories. Based on relationships and eligibility rules, it creates *new* perspective-owned `MemoryRecords` for recipient NPCs.
6.  **Retrieval:** The player approaches an NPC. Moirai queries SQLite for relevant `MemoryRecords` and valid `ActionRecords`.
7.  **Recall Filter (NEW):** A lightweight filter step sits between the database and the chat prompt. It applies forgetting, vagueness, distortion, and emotional framing to the retrieved records based on their stability and age.
8.  **LLM Generation:** The filtered, imperfect memory context is injected into the system prompt for the live conversation.

---

## 4. Behavioral Rules

*   **Propagation Eligibility:** Memories only propagate if `PrivacyLevel` is 'shareable' or 'public'. Propagation is not automatic; it requires a justified relationship/context between the source and target NPC.
*   **Perspective Ownership:** Propagation ALWAYS creates a new, distinct `MemoryRecord` owned by the recipient. It NEVER copies the original record directly.
*   **Privacy Separation:** Private memory never propagates automatically. Privacy leaks must be designed as narrative events, not system bugs.
*   **Social Drift:** Repeated propagation between NPCs may alter the tone or certainty of the memory, but core facts remain stable unless explicitly contradicted.
*   **Action Lifecycle:** Actions represent intent, not fixed dialogue. They must transition through `pending`, `triggered`, `used`, and `expired`. They should not repeat endlessly.

---

## 5. Risk & Edge Case Analysis

| Risk | Consequence | Mitigation Strategy |
| :--- | :--- | :--- |
| **Over-sharing** | Breaks immersion; makes the town feel too small or gossipy. | Enforce strict Propagation Eligibility rules. Cap the number of synthesized propagation events per time gap. |
| **Over-precision** | Robotic NPC behavior; perfectly quoting past conversations. | Rely on the Recall Filter to intentionally introduce vagueness or hesitation based on `RecallStability` and elapsed time. |
| **Over-distortion** | Continuity breaks; NPCs confidently claiming things that never happened. | Core facts in Moirai are immutable. Restrict the Recall Filter's ability to mutate 'stable' memories with 'low' distortion risk. |
| **Repetition** | Annoying dialogue; NPCs bringing up the same hook every time. | Strictly enforce the Action Lifecycle. Once an action is `triggered` or `used`, it must not be injected into future prompts. |
| **Missing Expiration** | Stale memory loops; NPCs holding onto irrelevant intents. | ActionRecords must have `TriggerWindowEnd`. Moirai sweeps and marks them `expired` during load synthesis. |

---

## 6. Implementation Status (COMPLETED)

The refinement of the memory pipeline was finalized in May 2026.

**Phase 1B: Schema & Extraction Extension (COMPLETED)**
*   SQLite tables updated with classification fields.
*   Extraction prompts hardened to output structured JSON with metadata.

**Phase 2: The Recall Filter (COMPLETED)**
*   `ApplyRecallFilter` implemented in `UPlayerConversationComponent`.
*   Introduces local rumor phrasing, hesitation, and vagueness based on memory age and stability.
*   **Safety Hardening:** Uses narrative-first terms like **"Your Experiences"** (instead of Internal Knowledge) and **"Local Rumors & News"** (instead of Social Reports) to bypass LLM privacy and safety refusals.

**Phase 3: Action Lifecycle Enforcement (COMPLETED)**
*   `LoadMemoryContext` filters by `ActionState` and trigger windows.
*   Post-conversation resolution and load-time expiration sweep implemented.

**Phase 4: Controlled Social Propagation (COMPLETED)**
*   Scored propagation logic in `UMoiraiContinuitySubsystem`.
*   **Atomic Bookkeeping:** Every exchange writes Memory, Event, and Interaction records in one transaction.
*   **Depth & Breadth Caps:** Hard limit of 2 social hops; max 1 recipient per fact per synthesis cycle.
*   **Loop Suppression:** Block recursive hearsay actions unless target is directly implicated.
*   **Targeted Action Semantics:** Social actions now require a concrete recipient and justification.
