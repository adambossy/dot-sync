---
name: smart-plan
description: Generate a project plan as a navigable tree of HTML pages — executive summary at the root, progressively more detail as you drill down. Includes a left sidebar tree, per-section read-state checkboxes with localStorage persistence, and a serif-forward editorial style. Use whenever the user invokes /SmartPlan, asks for a "smart plan", "tree plan", "structured plan", or any plan that should be browsable rather than a single long doc.
---

# SmartPlan

Generate a project plan as a tree of self-contained HTML pages. Depth comes from descending the tree, never from longer pages.

## When to use

- The user invokes `/SmartPlan` (with or without a topic)
- The user asks for a multi-level, tree-structured, or browsable plan
- The topic has enough surface area that a single document would be skimmed instead of read

## Shape of the tree

- **Root (`index.html`)** is an executive summary: one page, ~500–800 words. Frame the goal, the strategy, the big tradeoffs. Link to every top-level branch.
- **Internal nodes** expand one facet of the parent. Each page is a 1-pager that reads in under ~2 minutes.
- **Leaves** are the deepest concrete pages — checklists, recipes, references, specific decisions.
- **Do not pre-balance.** Let the shape of the problem dictate the tree. One branch may be three levels deep while another is a single leaf. That's correct.
- Cross-link siblings when concepts touch.

### Required top-level branches

Every SmartPlan must include — in addition to whatever the topic demands:

- An **Assumptions & open questions** page (`assumptions/index.html`) at the top level. See "Assumptions & open questions" below.

## Requirements blocks (top of each page, where relevant)

Each page that describes work to be done should open with a short **Requirements** block, written in plain English. These are user-story–shaped statements (but not strictly "As a … I want … so that …") that capture *what success looks like* before any implementation talk. They live directly under the page header, before the first numbered section.

Rules:

- Plain English. No symbols, no function names, no file paths, no library names. A non-technical reader should follow them.
- 2–6 statements per page, each a single sentence.
- Concrete: name the user, the outcome, and the reason it matters.
- Skip the block on purely descriptive pages (e.g. a comparison sub-page where there is no user-facing outcome being committed to). Most pages will have one.

Markup (already styled in `style.css`):

```html
<section class="requirements">
  <h2>Requirements</h2>
  <ol>
    <li>Anyone in the household can talk to the agent from their phone without learning a new app or a VPN client.</li>
    <li>A power outage longer than the UPS battery does not lose any conversation history.</li>
    <li>The owner can tell, at a glance, whether the agent answered locally or paid for a hosted model.</li>
  </ol>
</section>
```

## Diagrams: Mermaid only

If a page benefits from a diagram, use **Mermaid**. Never ASCII art, never inline SVG hand-rolled diagrams.

- Include the Mermaid CDN script at the bottom of every page (already in the page template). Mermaid is the one external dependency the skill allows; everything else stays local.
- Wrap each diagram in `<div class="mermaid">…</div>`. The included `smartplan.js` initialises Mermaid with a theme that matches the editorial palette.
- Prefer the smallest diagram that conveys the idea: a flowchart with 4–8 nodes, a sequence with 3–5 participants. If you find yourself drawing more than ~12 nodes, the diagram should probably be on a sub-page or split.

Example markup:

```html
<div class="mermaid">
flowchart LR
  user[You] --> ui[Web UI]
  ui --> orchestrator[Agent loop]
  orchestrator --> local[Local vLLM]
  orchestrator -. escalate .-> hosted[Hosted Claude]
</div>
```

## Assumptions & open questions

A SmartPlan is generated from a half-defined brief. Every plan therefore makes assumptions. Surface them — don't bury them.

### During generation (preferred): ask the user

Before writing the tree, the planning agent should identify the 2–4 most consequential unknowns and **ask the user**, using whatever interactive tool it has:

- In **Claude Code / Claude Agent SDK**: call `AskUserQuestion` with up to 4 questions, each with 2–4 options. Use it for branching decisions that materially change the plan (budget, scope, constraints, what success looks like).
- In **other agents**: use the equivalent interactive prompt, or fall back to a clearly labelled "Assumed:" prefix on the page.

What to ask vs. what to assume:

- **Ask** when the answer changes the tree's shape (e.g. budget tier, region, audience, team size).
- **Assume** for tactical defaults that a reader can correct quickly (e.g. cron schedule, exact tool name). Record the assumption on the assumptions page.

Don't ask more than 4 questions; the planning agent should be capable of making sensible defaults and capturing them.

### On the page: a dedicated branch

Every plan has a top-level `assumptions/index.html` page with three sections:

1. **What I asked you** — questions the user answered, and what they said. One row per question.
2. **What I assumed without asking** — every default the agent picked. Each row: the assumption, the alternative, why this default was chosen, and which page(s) it affects.
3. **Open questions** — things the agent could not resolve and the reader should think about. Each item names the section that depends on it.

The assumptions page is part of the tree manifest like any other branch, and its sections get read-state checkboxes like every other section.

### Open questions must link both ways

An open question is only useful if the reader can get from the question to the work it blocks, and from the work to the question. Wire up both directions:

- **Give every open question a stable `id`** on the assumptions page (e.g. `<li id="oq-budget-tier">…`). Each open question's text links *to* the page/section it affects, using a relative href and a section anchor: `…affects <a href="../infra/index.html#sizing">Infrastructure → Sizing</a>.`
- **From the affected section, link back to the question.** Any section whose content rests on an unresolved question carries an inline marker that links to that question on the assumptions page — e.g. `<a class="open-q" href="../assumptions/index.html#oq-budget-tier">Open question: budget tier</a>`. Place it where the dependency bites, not just at the top of the page.
- **Keep the two sides in sync.** If a question is resolved or removed during an update, remove its back-links too (and bump the affected sections' `data-section-version`, since their content premise changed).
- The `.open-q` class is styled in `style.css`. These links are interactive elements, so clicking one never toggles the surrounding section's read state.

## Output layout

Default output directory: `./smartplan-<slug>/` (override if the user gives a path). All HTML pages share one `style.css` and one `smartplan.js` at the plan root. Sub-pages reference them with relative paths.

```
smartplan-<slug>/
├── index.html                       # root (executive summary)
├── style.css                        # copy verbatim from assets/style.css
├── smartplan.js                     # copy verbatim from assets/smartplan.js
├── <branch-a>/
│   ├── index.html
│   └── <leaf-1>.html
├── <branch-b>/
│   ├── index.html
│   └── <sub-branch>/
│       └── index.html
```

## Generation procedure

1. **Ask first.** Identify 2–4 unknowns whose answers change the tree's shape and ask the user with `AskUserQuestion` (Claude Code) or the host agent's equivalent. Skip if you genuinely have enough context.
2. **Research & explore (read-only).** Before sketching the tree, gather the context the plan will rest on. You're learning, not building — don't create or modify anything.
   - Read any files, briefs, or references provided to you.
   - If the plan touches an existing codebase, find existing patterns and conventions, understand the current architecture, identify similar features as reference, and trace the relevant code paths. Use Bash only for read-only operations (`ls`, `git status`, `git log`, `git diff`, `find`, `grep`, `cat`, `head`, `tail`).
   - **Use web search freely** — especially when the plan involves third-party libraries, vendors, APIs, or services. Verify current versions, pricing, rate limits, setup steps, and recommended practices rather than guessing. A plan built on stale or assumed third-party details is worse than one that honestly records an open question.
   - Anything you can't resolve here becomes an entry on the `assumptions/` page (an assumption you made, or an open question for the reader).
   - Skip or trim this when you genuinely already have enough context.
3. **Sketch the tree** on paper. Include the `assumptions/` branch. List every node with a one-line purpose. Decide which are leaves. Don't write any HTML yet.
4. **Assign IDs.** Every node gets a stable kebab-case `id` (used as the `pageId` and in localStorage). Every section within a page gets a unique kebab-case `id`.
5. **Create the directory** and copy the shared assets:
   ```bash
   mkdir -p smartplan-<slug>
   cp <SKILL_DIR>/assets/style.css smartplan-<slug>/
   cp <SKILL_DIR>/assets/smartplan.js smartplan-<slug>/
   ```
   Where `<SKILL_DIR>` is the directory containing this `SKILL.md` (for the default install, `~/.agents/skills/smart-plan` or `~/.claude/skills/smart-plan`).
6. **Build the tree manifest** (JSON) — see "Tree manifest" below. The exact same JSON is embedded in every page so the sidebar is identical everywhere.
7. **Generate each HTML page** from the template in `assets/page-template.html`. Per-page fill-ins:
   - `data-plan-id`, `data-page-id`, `data-page-depth` on `<body>`
   - the `<link>` and `<script src>` paths (`../style.css` etc. based on depth)
   - the breadcrumb trail
   - the page header (`eyebrow`, `h1`, `lede`)
   - **a `<section class="requirements">`** with 2–6 plain-English statements, where relevant
   - the sections, each with a unique `id` and a `<input type="checkbox" class="section-check" data-section-id="…">` in its `<header class="section-header">`
   - any Mermaid diagrams as `<div class="mermaid">…</div>`
   - the JSON in `<script id="smartplan-tree" type="application/json">`
   - the Mermaid CDN script (already at the bottom of the template)
8. **Generate `assumptions/index.html`** — three sections: "What I asked you", "What I assumed without asking", "Open questions". Give each open question a stable `id`, link it to the section(s) it affects, and add a matching `.open-q` back-link in each of those sections (see "Open questions must link both ways").
9. **Verify** by opening `index.html` in a browser. The sidebar should appear, every section should have a checkbox on the right, Mermaid diagrams should render, and checking a section should fill the dot next to that page in the sidebar.
10. **Review the open questions with the user.** Once the plan exists, walk back through every open question on the `assumptions/` page and put each one to the user — in Claude Code, use `AskUserQuestion` (or the host agent's equivalent interactive prompt elsewhere). Ask about all of them, not just the ones that fit in a single batch; `AskUserQuestion` takes up to 4 questions per call, so make multiple calls if there are more. As the user answers, fold each resolution into the plan: move it from "Open questions" to "What I asked you", update the affected section(s), bump those sections' `data-section-version`, and remove the now-stale `.open-q` back-links (see "Updating an existing plan"). Leave genuinely unanswered questions ("Other" / skipped) where they are.

## Updating an existing plan

When the user asks you to revise a plan that already exists (rather than generating a fresh one), preserve the reader's progress where you can and reset it only where the content actually changed.

- **Give every section a `data-section-version`.** The simplest scheme is a small integer or short date stamp (e.g. `data-section-version="2"` or `"2026-05-27"`). On first generation, set them all to the same starting value.
- **Bump the version of any section whose content you change.** When you rewrite, materially edit, or restructure a section, increment that section's `data-section-version`. On the reader's next visit, `smartplan.js` notices the new version and flips that section back to unread — so they know to re-read it — while leaving every untouched section's read state intact.
- **Don't bump for trivial edits.** A typo fix or a reworded sentence that doesn't change the meaning isn't worth forcing a re-read. Use judgement: bump when a reader who already read the old version would want to read again.
- **Keep section `id`s stable across updates.** Read state is keyed by `id`. Renaming an `id` orphans the old read state instead of resetting it. Change the version, not the id.
- **If you add or remove sections,** update the manifest's `sections` list to match, exactly as on first generation.

## Tree manifest

Every page contains the same manifest, embedded as JSON. It drives the sidebar.

```json
{
  "title": "Plan title",
  "root": {
    "id": "root",
    "label": "Executive summary",
    "href": "index.html",
    "sections": ["the-goal", "strategy", "tradeoffs"],
    "children": [
      {
        "id": "branch-a",
        "label": "Branch A",
        "href": "branch-a/index.html",
        "sections": ["context", "approach", "open-questions"],
        "children": [
          { "id": "branch-a-leaf-1", "label": "Sub-leaf", "href": "branch-a/leaf-1.html", "sections": ["checklist"] }
        ]
      }
    ]
  }
}
```

Rules:
- `href` is always **relative to the plan root** (`smartplan-<slug>/`). `smartplan.js` rewrites it per page using `data-page-depth`.
- `sections` lists every section `id` on that page. Used to compute read-state dots (none / partial / complete).
- `id` is the `data-page-id` of the page at `href`. They must match.

## Read state contract

- localStorage key: `smartplan:<plan-id>`
- Shape: `{ "<page-id>": { "<section-id>": true, ... }, ... }`
- A sidebar dot shows three states:
  - empty ring — no sections read
  - half-filled — some sections read
  - filled — all `sections` for that node read
- `smartplan.js` handles all of this. Authors only need to ensure every section has a checkbox with the correct `data-section-id`, and every section's `id` is in the manifest's `sections` list.
- **Section versions (for updates).** A `.section-check` may carry an optional `data-section-version="…"` attribute. `smartplan.js` remembers the last version it saw for each section (under a `__versions` key in the same localStorage entry). When the version it reads differs from the stored one, it clears that section's read flag so the reader sees it as unread again. Sections with no `data-section-version` are never auto-reset. See "Updating an existing plan" for when to bump it.
- Each section that contains a `.section-check` becomes click-to-toggle: anywhere in the section's box toggles the checkbox. Clicks on links, buttons, inputs, and labels are passed through; text selections do not toggle. The section also gets hover and active visual states. Sections without a checkbox (e.g. `.requirements`, diagram-only sections) are not clickable.

## Style guidance

- Editorial serif at body; sans-serif for chrome and small labels. Don't add new fonts.
- Each page should feel like a 1-pager — prose, short lists, the occasional table.
- **Favor bulleted lists over dense enumerative prose.** When a sentence or paragraph strings several discrete items together — especially with semicolons or a run of "X does this; Y does that; Z does the other" — break it into a bulleted list with one item per line. A reader should be able to scan the distinct points without parsing a wall of text. Reserve flowing prose for genuine narrative or argument; the moment you're enumerating parallel things (steps, components, responsibilities, transitions, options), reach for a list.
- Use `<details>`/`<summary>` (from the included styles) to fold subordinate detail within a page without leaving the page.
- Prefer concrete numbers, dates, named tradeoffs, and links to children over generic prose.
- Diagrams: Mermaid only. No ASCII art.
- No emojis.
- One external dependency is allowed: the Mermaid CDN script. Everything else is local.

## Page-template reference

See `assets/page-template.html` for the canonical skeleton. The two pieces that vary per page are:

- `<body data-plan-id="…" data-page-id="…" data-page-depth="N">` — where N is the number of directory levels below the plan root (root = 0; `branch-a/index.html` = 1; `branch-a/sub/leaf.html` = 2).
- The `<main>` content area between the header and the closing `</main>`.

Everything else (sidebar `<aside>`, script/link tags, manifest `<script>` tag) is the same shape on every page.
