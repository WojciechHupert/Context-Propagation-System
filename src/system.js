import './style.css';
import './system.css';

const nodeData = {
  // --- Main Line ---
  conversation: {
    title: "Dialogue Ingestion",
    body: "The authoritative transcript. Every user turn and clean assistant reply is stored in the canonical SQLite database. Non-authoritative rows are ignored.",
    list: ["<strong>Owner:</strong> UPlayerConversationComponent", "<strong>Rule:</strong> Excludes meta-channel and error rows"]
  },
  sanitization: {
    title: "Sanitizer Checkpoint",
    body: "Assistant outputs are scrubbed of reasoning traces, meta-commentary, and style notes. If it fails, a one-step repair pass is triggered.",
    list: ["<strong>Goal:</strong> Prevent Context Poisoning"]
  },
  maintenance: {
    title: "Maintenance / LLM Extraction",
    body: "Secondary LLM request after a turn threshold. Extracts only durable, transcript-grounded facts, preferences, and commitments.",
    list: ["<strong>Focus:</strong> Grounded facts only"]
  },
  hub: {
    title: "MemoryRecords Hub",
    body: "The core persistence layer. Memories chain chronologically via PreviousMemoryId to build narrative threads.",
    list: ["<strong>Metadata:</strong> ImportanceScore, PrivacyLevel", "<strong>Tracing:</strong> Tracks drift and mutation"]
  },
  engine: {
    title: "Moirai Engine",
    body: "Global social propagation authority. Runs 60s autonomous cycles to identify 'shareable' memories and route them to eligible NPCs.",
    list: ["<strong>Routing:</strong> Associative logic via NarrativeNetworks"]
  },
  gates: {
    title: "5 Logic Gates",
    body: "Every propagation attempt must pass: Eligibility, Identity, Relationship, Resonance, and Deduplication.",
    list: ["<strong>Failure:</strong> Halts specific transfer"]
  },
  propagation: {
    title: "Social Drift Hub",
    body: "When memory is cloned to a new NPC, it becomes a recipient-owned record. The OriginalSummaryText is preserved for drift auditing.",
    list: ["<strong>Drift:</strong> Original phrasing is maintained while confidence degrades"]
  },
  mutation_cap: {
    title: "Mutation Cap Check",
    body: "Propagation stops permanently if MutationCount reaches 2. This prevents global narrative echo chambers where everyone knows everything.",
    list: ["<strong>Rule:</strong> MutationCount ≥ 2 = Ineligible"]
  },
  recall: {
    title: "Recall Filter",
    body: "NPCs don't recite DB entries. Retrieval is bucketed and capped, then passed through a speech policy layer.",
    list: ["<strong>Buckets:</strong> Recent, Stable, Social, Emotional"]
  },
  npcoutput: {
    title: "NPC Spoken Output",
    body: "The final dialogue is delivered to the player via Unreal, incorporating Kokoro TTS audio generation.",
    list: ["<strong>Engine:</strong> UPlayerConversationComponent"]
  },

  // --- Edge Cases / Rejection Track (Orange) ---
  rej_sanitization: {
    title: "Rejected: Meta/Reasoning",
    body: "Dialogue containing chain-of-thought, speculative facts, or style notes is discarded. Only raw character speech passes.",
    list: ["<strong>Action:</strong> Discarded or triggers repair"]
  },
  rej_eligibility: {
    title: "Rejected: Private Memory",
    body: "Memories tagged with PrivacyLevel == 'private' are blocked from the Moirai Engine. They remain internal to the original NPC.",
    list: ["<strong>Security:</strong> Prevents secret leakage"]
  },
  rej_resonance: {
    title: "Rejected: No Resonance",
    body: "If the target NPC's NarrativeNetworks do not align with the memory's Tags, the rumor is ignored as irrelevant.",
    list: ["<strong>Filter:</strong> Social thematic matching"]
  },

  // --- Action Track (Purple) ---
  action_record: {
    title: "Action Intent Formed",
    body: "When an NPC promises to do something (e.g., 'visit NPC2 in one hour'), an ActionRecord is generated from the conversation.",
    list: ["<strong>Intent:</strong> Structured commitment"]
  },
  action_trigger: {
    title: "Trigger Window Active",
    body: "The system waits for world-state conditions or time bounds to become valid before execution is allowed.",
    list: ["<strong>Cooldowns:</strong> Prevent stale action flooding"]
  },
  action_expiry: {
    title: "Action Expiry / Executed",
    body: "The action is either autonomously executed (generating an NpcInteractionRecord) or expires unfulfilled.",
    list: ["<strong>Result:</strong> State change or expiration"]
  },

  // --- Categorization Track (Green) ---
  cat_stable: {
    title: "Stable Facts",
    body: "Memories categorized as objective truth or core background. These have low drift and high persistence.",
    list: ["<strong>Usage:</strong> Long-term recall"]
  },
  cat_social: {
    title: "Social Interactions",
    body: "Memories regarding relationships, rumors, and opinions. Highly susceptible to propagation and drift.",
    list: ["<strong>Usage:</strong> Gossiping and alliances"]
  },
  cat_emotional: {
    title: "Emotional Peaks",
    body: "Memories with high emotional weight. Prioritized during recall but may distort over time.",
    list: ["<strong>Usage:</strong> Reaction and mood shifts"]
  },

  // --- Gossip / Social Track (Blue) ---
  gossip_clone: {
    title: "Clone Memory",
    body: "A valid shareable memory is cloned. Private clauses are explicitly stripped before the new record is generated.",
    list: ["<strong>Privacy:</strong> Sanitized for sharing"]
  },
  npc_recipient_1: {
    title: "Recipient NPC (Hop 1)",
    body: "The rumor reaches its first listener. MutationCount becomes 1.",
    list: ["<strong>Status:</strong> New knowledge acquired"]
  },
  npc_recipient_2: {
    title: "Recipient Memory Integrated",
    body: "The NPC now owns this memory and can use it in future conversations or actions.",
    list: ["<strong>Owner:</strong> Recipient NPC"]
  },
  npc_recipient_3: {
    title: "Hop 2 (Max Depth)",
    body: "The rumor spreads one more time. MutationCount hits 2. The memory is now permanently blocked from further propagation.",
    list: ["<strong>Status:</strong> Propagation halted"]
  },

  // --- Recall / Emotional Track (Pink) ---
  recall_vagueness: {
    title: "Age-Based Vagueness",
    body: "Older memories lose specific details. 'I saw him at 3 PM yesterday' becomes 'I saw him recently.'",
    list: ["<strong>Filter:</strong> Temporal degradation"]
  },
  recall_hesitation: {
    title: "Uncertainty Hesitation",
    body: "Propagated memories (hearsay) force the LLM to use hedging language ('I heard that...', 'Maybe...').",
    list: ["<strong>Speech Policy:</strong> Must attribute hearsay"]
  },

  // --- Studio Cards ---
  'studio-sys': {
    title: "Systems / Sanctum",
    body: "Health telemetry showing active conversation turns, verified durable memories, and database latency."
  },
  'studio-sub': {
    title: "Subjects / Subject Weaver",
    body: "Identity management for all 6 NPCs. Edits compile directly to the runtime SystemPrompt."
  },
  'studio-arc': {
    title: "Archives / Oracle",
    body: "Moderation grid for transcripts and propagation tracing. View mutation audits and hop counters."
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const panelTitle = document.getElementById('panel-title');
  const panelContent = document.getElementById('panel-content');

  const nodes = document.querySelectorAll('.interactive-node');
  nodes.forEach(node => {
    node.addEventListener('click', () => {
      nodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');
      
      const key = node.getAttribute('data-info');
      const data = nodeData[key];
      if (data && panelTitle && panelContent) {
        panelTitle.innerText = data.title;
        let html = "<p style='margin-bottom:16px;line-height:1.6;font-size:0.9rem;'>" + data.body + "</p>";
        if (data.list) {
          html += "<ul class='prop-list'>";
          data.list.forEach(item => { html += "<li>" + item + "</li>"; });
          html += "</ul>";
        }
        panelContent.innerHTML = html;
      }
    });
  });

  const defaultNode = document.querySelector('[data-info="conversation"]');
  if (defaultNode) defaultNode.click();
});
