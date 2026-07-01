# BrandSync MCP — Jira Workflow Demo Runbook

**Audience:** Mixed (technical + non-technical)
**Duration target:** ~15–20 min
**Format:** Intro → Slides → Live demo (Claude Desktop → BrandSync MCP → Claude Code)

> Tip: keep this file open on a second monitor. The **bold prompts** are meant to be typed verbatim into Claude Desktop. The *italic lines* are what you say out loud to the room.

---

## 0. Before you walk in (pre-flight checklist)

- [ ] Claude Desktop open, BrandSync MCP connector showing **connected** (green).
- [ ] Claude Code open in a terminal / IDE on the target repo.
- [ ] Pick the Jira ticket you'll pull live. Recommended: a ticket that maps to the **Service Request** pattern (multi-screen CRUD flow) or **Dashboard** pattern — both exist in the corpus, so the demo lands cleanly.
- [ ] Sanity-check the MCP is alive: ask Claude Desktop **"Run graph_stats on BrandSync"** — should return *114 nodes, 45 edges, 6 communities*. (If this works, everything downstream works.)
- [ ] Have the backup outputs ready (see §6) in case live calls hiccup.
- [ ] FigJam board open (empty or templated) for the workflow visualization.

---

## 1. Intro about me (~1–2 min)

*Keep it short and human — name, role, why you care about this.*

Talking points:
- Who you are + what you do at EG.
- One line on the problem you live with: *"Design-to-dev handoff is where intent gets lost — designers describe it, devs rebuild it, and the design system drifts."*
- *"BrandSync MCP is our attempt to make that handoff machine-readable — so the AI works from the same source of truth designers and developers do."*

---

## 2. Slides — What is BrandSync MCP? (~4–5 min)

### Slide A — The one-liner
> **BrandSync MCP turns our design system into a queryable knowledge graph that Claude can reason over — live, inside the tools we already use.**

*For the mixed room:* MCP (Model Context Protocol) = a standard plug that lets Claude safely talk to our internal systems. BrandSync is the design-system "brain" behind that plug.

### Slide B — Why it matters (value, no jargon)
- **Single source of truth** — components, patterns, tokens, and guidelines all in one graph.
- **No copy-paste handoff** — the requirement, the design decisions, and the code spec travel together.
- **Consistency by default** — generated UI uses *our* components and *our* tokens, not generic guesses.

### Slide C — Core features (the graph numbers make this concrete)
- **Knowledge graph:** 114 nodes · 6 communities — concepts linked, not just listed.
- **30 production components** — Buttons, Card, Table, Input Fields, Progress Stepper, Snackbar, … (full design-system catalog).
- **Reusable patterns** — full-screen + multi-screen flows (Dashboard, Service Request CRUD, Forms) with components, tokens, states, and accessibility baked in.
- **Design tokens** — every pattern lists the exact `--bs-*` tokens to use.
- **Discovery tools** — `search_guidelines`, `god_nodes` (most-connected concepts), `query_graph`, `get_neighbors`.
- **Handoff layer** — `save_handoff` / `load_handoff` carry the full spec from designer-AI to developer-AI.

### Slide D — The flow you're about to see
```
Jira ticket  →  Claude Desktop + BrandSync MCP
                 ├─ understand the requirement (design pipeline)
                 ├─ produce a FigJam workflow
                 ├─ select components + patterns from the graph
                 └─ save_handoff  ──►  Claude Code  →  generates the UI  →  working flow
```
*"So the AI that understands design hands off to the AI that writes code — with nothing lost in translation."*

---

## 3. Live Demo — Part 1: Pull the ticket & understand it (~3 min)

*Switch to Claude Desktop.*

**Prompt 1 — pull the ticket:**
> **"Pull Jira ticket [TICKET-ID] and summarize the requirement in plain language — what are we actually building, for whom, and what are the acceptance criteria?"**

*Say:* "Notice it's reading the real ticket — not me pasting text."

**Prompt 2 — run the design pipeline / understand requirement:**
> **"Using the BrandSync design system, analyze this requirement. What kind of screen(s) is this? Search the guidelines for the right approach and tell me which design pattern fits best."**

➜ *This fires `search_guidelines`.* Expect it to surface a pattern like **Service Request** or **Dashboard**.

*Say:* "It's not guessing — it searched our actual design corpus and matched a vetted pattern."

---

## 4. Live Demo — Part 2: FigJam workflow + component selection (~4 min)

**Prompt 3 — produce the FigJam workflow:**
> **"Lay this out as an end-to-end user workflow I can drop into FigJam: list each screen, the user's steps through them, and the states for each screen (loading, empty, error, success)."**

➜ Map the output onto the open **FigJam board** as you talk — screens as frames, arrows as transitions.

*Say:* "This is the design thinking made explicit — every screen, every state — before a line of code."

**Prompt 4 — check available components & patterns:**
> **"Now check what's actually available in BrandSync. Which components and patterns should each screen use, and what design tokens apply? Pull the full spec for the main pattern."**

➜ *This fires `list_components`, `get_pattern`, `get_component`, `get_tokens`.*

*Say:* "It's binding the design to real, named components and tokens — so what we build is on-brand and reusable from day one."

---

## 5. Live Demo — Part 3: Handoff → Claude Code → working UI (~4 min)

**Prompt 5 — craft the developer handoff:**
> **"Craft a complete developer handoff for this and save it via BrandSync. Include: the requirement summary, the screens & flow, the chosen pattern, every component and design token to use, the states, and accessibility notes."**

➜ *This fires `save_handoff`.* Note the handoff ID/slug it returns — you'll reference it next.

*Say:* "That's the whole brief — requirement to spec — in one machine-readable object."

*Switch to Claude Code (the developer AI).*

**Prompt 6 — generate the UI in Claude Code:**
> **"Load the BrandSync handoff [handoff-id] and generate the UI for it — use the specified BrandSync components, patterns, and design tokens exactly. Build the full end-to-end flow."**

➜ *This fires `load_handoff` and then code generation.*

*Say:* "Same source of truth, now on the dev side. The designer-AI and the developer-AI never drifted apart — they shared the graph."

**Prompt 7 — show it running:**
> **"Run it so we can click through the flow."**

➜ Click through the screens. Land on the close.

---

## 6. Backup plan (if a live call hiccups)

- If the MCP connection drops: re-run **"Run graph_stats on BrandSync"** to reconnect attention; if still down, switch to pre-saved outputs.
- Keep these ready as fallback artifacts:
  - [ ] Screenshot of the `search_guidelines` → pattern match.
  - [ ] The FigJam board pre-populated.
  - [ ] The saved handoff text.
  - [ ] A pre-generated screenshot/recording of the final UI.
- Golden rule: **never debug live.** If something breaks, narrate over the backup screenshot and move on.

---

## 7. Closing (~1 min)

*Tie back to the intro problem:*
- "We started with a Jira ticket and ended with a working, on-brand UI — and the design intent never got lost."
- "One graph, two AIs, zero copy-paste."
- Call to action: where this goes next (rollout, more patterns, your ask of the audience).

---

## Appendix — Tool cheat-sheet (what fires when)

| Demo moment | BrandSync tool(s) |
|---|---|
| Sanity check | `graph_stats` |
| Understand requirement | `search_guidelines` |
| Most-connected concepts (optional flex) | `god_nodes`, `query_graph`, `get_neighbors` |
| Pattern fit | `get_pattern` |
| Component selection | `list_components`, `get_component` |
| Tokens | `get_tokens` |
| Save handoff (designer side) | `save_handoff` |
| Load handoff (dev side / Claude Code) | `load_handoff` |

**Verified live in prep:** 114 nodes / 45 edges / 6 communities · 30 components · patterns incl. *Service Request* (multi-screen CRUD), *Dashboard Design 1* (analytics).
