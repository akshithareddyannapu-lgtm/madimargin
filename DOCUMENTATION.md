# DOCUMENTATION.md — MandiMargin

> **Status: DRAFT skeleton generated ahead of the build.** Parts B and C are filled in based on what was actually built. Part A4 (business case numbers), Part D (team + disclosure), and the README header block still need real team input — every remaining placeholder is marked `TODO(team)`. Do not submit until every `TODO(team)` is resolved.

## Part A — The product case

### A1. Unique selling proposition

**One sentence:** MandiMargin tells independent rice merchants and mill owners in Andhra Pradesh and Telangana, in seconds each morning, which neighboring district nets them the most money for today's harvest after freight — something no general-purpose chatbot or manual price check does automatically.

TODO(team): one paragraph earning that sentence — pull in a concrete before/after (e.g. "a merchant checking 3 mandi price pages and doing freight math by hand today takes X minutes; MandiMargin takes Y seconds").

### A2. Target audience

Independent rice merchants and small mill owners in the AP/Telangana rice belt who personally decide, each morning, where to truck that day's paddy/rice. Today they either sell to the nearest mandi out of convenience, or call around/check Agmarknet and do freight math by hand — both cost time, and the second one is error-prone under time pressure.

TODO(team): make this concrete — a rough count of merchants in scope, how they currently decide (ask 2-3 real merchants if possible), and what a wrong or slow decision costs them in ₹ per trip.

### A3. Novelty and competitive differentiation

| Alternative | Where MandiMargin is better | Where it's worse | Why it matters |
|---|---|---|---|
| ChatGPT / Claude / Gemini (general chatbot) | Purpose-built arbitrage math with live-fetched prices and a structured comparison card, not a generic conversation | No general knowledge outside rice/AP/Telangana; won't help with anything else | A merchant gets a direct number, not a conversation they have to steer and verify themselves |
| Checking Agmarknet / mandi board sites manually | One request instead of several page visits; automatically nets out freight, which manual price-checking usually skips | Depends on the same underlying data being reachable; not a replacement for official records | Freight-blind price comparison is exactly the mistake the product exists to fix |
| Calling a broker / local trader | No commission, no relationship dependency, available any time including early morning | No human judgment about buyer reliability, quality negotiation, or relationship trust | Useful as a first check before or alongside a broker call, not a full replacement |
| Doing nothing / selling locally by habit | Surfaces the ₹ opportunity cost of not checking | Requires the merchant to trust and adopt a new habit | This is the behavior the product is trying to change |

TODO(team): tighten this table with real observations from talking to merchants; "AI-powered" alone is not a differentiator per the brief.

### A4. Value generation and business case

TODO(team) — fill every number below with a stated assumption and its source (public figure, interview, or reasoned estimate), then compute:

```
Expected net value
  = eligible volume
  × adoption (share of eligible volume reached)
  × incremental effect per use
  × unit value of that effect
  × benefit-capture rate
  − total cost of ownership (model usage, hosting, data, maintenance, oversight)
  − expected loss from errors and risk
```

Starting structure:

1. **Use** — TODO(team): estimate eligible daily sell-decisions across the target merchant population in AP/Telangana (e.g. number of active rice merchants/mill owners × ~1 sell-decision/day during harvest season).
2. **Adoption** — TODO(team): realistic share of that volume reached in year 1 (a public no-login tool with no marketing budget should assume low adoption, e.g. low single-digit %, unless the team has a distribution plan).
3. **Impact** — TODO(team): incremental ₹/quintal margin from picking the best net-profit district vs. selling locally, relative to an explicit baseline (e.g. "average of the price differential across the tool's demo runs" or a merchant-interview estimate).
4. **Value generation** — TODO(team): who captures the impact (the merchant, almost entirely) and the realistic capture rate (adoption friction, distrust of a new tool, etc.).

**TCO** — TODO(team): Anthropic/model usage (estimate per-query cost × expected query volume), Exa API cost, Vercel hosting (should be free/hobby tier at this volume), Pinecone (free tier likely sufficient).

**Risk** — stale or wrong price data leading to a bad shipping decision. Mitigated by: every price shown is labeled live vs. reference with a date, and the assistant is instructed to always tell the user to confirm at the destination mandi before shipping (see prompts.ts `ARBITRAGE_PROMPT`).

**Metrics (≥3 of 5 layers required):**

| Layer | Metric | Owner |
|---|---|---|
| Technical performance | Live-price fetch success rate (live vs. fallback ratio), p50/p95 response latency | TODO(team — e.g. the engineer who owns app/api/chat/tools/arbitrage.ts) |
| User adoption/engagement | Daily active users, queries per user per week, guided-form vs. free-text usage split | TODO(team) |
| Financial impact | Estimated ₹ margin uplift captured per completed recommendation (net profit shown minus local-sale net profit) | TODO(team) |

TODO(team): add operational KPIs and/or strategic outcomes if you want a 4th/5th layer, and name ONE overall value owner accountable for the end-to-end result.

**What would have to be true for this case to fail:** merchants don't trust a tool with no track record over their existing broker relationship; live price fetching is too unreliable (mostly falls back to reference data) to be actionable; the freight-rate input is too much friction for a quick morning check; neighboring-district trips aren't actually logistically realistic for small merchants without their own trucks.

## Part B — Features beyond the myAI6 base

| Feature | What the user experiences | Which link of the value chain it serves | Where it lives in the code |
|---|---|---|---|
| Arbitrage calculator (new tool) | Assistant computes net profit (price × quantity − freight × distance) across the origin district and its neighbors, with each price labeled live or reference and dated | Impact + value generation (this is the calculation that creates the ₹ uplift) | `app/api/chat/tools/arbitrage.ts` (tool + Exa price fetch + Haversine distance), `lib/districts.ts` (district/adjacency/fallback data), registered in `lib/ai/tools.ts` |
| Guided intake form + result cards (new UI) | A short form (district select, quantity, freight ₹/km) above the chat input on a fresh conversation composes one well-formed request instead of free typing; results render as a deterministic comparison card per district (not just prose), with the best option highlighted | Adoption (lower friction to a correct first query) + use (repeatable, scannable output) | `components/arbitrage-intake-form.tsx` (intake), `components/messages/arbitrage-card.tsx` (result card), wired into `app/page.tsx` and `components/messages/assistant-message.tsx` |

**Design rationale.**

*Arbitrage calculator*: the alternative was to let the model estimate prices/distances from its own knowledge, which the assignment explicitly prohibits (no fabricated facts) and which would be unreliable for daily-changing mandi prices. Building it as a tool with a strict input schema also lets the system prompt enforce "ask before guessing" for the three required inputs. Deliberately left out: a paid maps API (Google Maps/Mapbox) — a static lat/long table + Haversine formula with a fixed road-distance fudge factor removes an API-key dependency and per-call cost for a public, no-login deployment, at the cost of some distance accuracy (documented in C6).

*Guided intake + result cards*: the alternative was to rely entirely on free-text chat and the model's own prose to present results. A structured form removes the "what exactly do I type" barrier for a first-time user (directly serving A2's target audience), and a deterministic result card (built from the tool's JSON output, not the model's text) guarantees the comparison table is always well-formed and never misses a district, unlike relying on the model to format a table correctly every time.

**Baseline configuration done (not counted as a feature):** renamed to MandiMargin (`config.ts`), rewrote the system prompt for the new identity/scope/guardrails (`prompts.ts`), updated `KB_SCOPE` and wrote new knowledge-base source documents (`RAGloader/content/text/`), removed the template's `fetchOwnerProfiles` tool (not applicable to a stakeholder-serving assistant — see C1).

## Part C — Technical documentation

### C1. Architecture

```
User (browser, no login)
  -> Next.js UI (app/page.tsx)
       - chat input (existing) + ArbitrageIntakeForm (NEW, components/arbitrage-intake-form.tsx)
       - MessageWall -> AssistantMessage
           - ToolCall / ToolResult (existing, generic tool status line)
           - ArbitrageCard (NEW, components/messages/arbitrage-card.tsx) — renders
             the arbitrageCalculator tool's structured JSON as a result card
           - Sources box (existing, from data-sources stream part)
  -> POST /api/chat (app/api/chat/route.ts, INHERITED, unmodified orchestration)
       - moderation (lib/moderation.ts, INHERITED)
       - compaction (lib/compaction.ts, INHERITED)
       - routing -> model (lib/ai/routing.ts, lib/ai/model-registry.ts, INHERITED)
       - tools (lib/ai/tools.ts, MODIFIED: added arbitrageCalculator, removed fetchOwnerProfiles)
           - arbitrageCalculator (NEW, app/api/chat/tools/arbitrage.ts)
               -> lib/districts.ts (NEW: static AP/Telangana district data, Haversine distance)
               -> Exa search (getExa(), reused from web-search.ts) for live mandi prices,
                  with a pre-seeded fallback price per district
           - vectorDatabaseSearch (INHERITED: Pinecone RAG over the new KB content)
           - webSearch (INHERITED: Exa web search, restricted to KB-scope background questions)
       - streamText (Vercel AI SDK, INHERITED) -> UI message stream -> client
```

Inherited from myAI6 unchanged: streaming chat UI, Pinecone 3-namespace RAG retrieval, citation canonicalization, content moderation, conversation compaction, rate limiting (`middleware.ts`), Vercel deployment config.

Added/changed for MandiMargin: the `arbitrageCalculator` tool and its district/distance/price-fetch logic, the guided intake form and result-card UI, the identity/prompts/KB rewrite, and removal of the `fetchOwnerProfiles` tool (myAI6's default tool fetches a single owner's public profile pages for "tell me about them" questions — there is no single "owner" persona in a stakeholder-serving product, so it was dropped rather than repurposed; `OWNER_NAME` is instead repurposed in `config.ts`/`prompts.ts` to describe the served audience for the parts of the template that still reference it).

### C2. Knowledge base

**Sources** (written for this project, not scraped from a third party — see `RAGloader/content/text/`):
- `districts-and-mandi-basics.md` — which districts/states are covered, what a mandi and Agmarknet are, and how the tool's live-vs-fallback pricing works.
- `rice-grading-basics.md` — common vs. Grade A paddy, moisture, foreign matter/broken grain, and what the tool's single reference price per district does and doesn't account for.
- `transport-cost-benchmarks.md` — indicative ₹/km freight ranges for context, and what the net-profit formula does and doesn't include (no mandi commission/handling fees).
- `merchant-faq.md` — what the assistant does and does not do, written for the end user.

**Selection**: written in-house rather than sourced from copyrighted/third-party material, per the assignment's "use only data you are allowed to use" rule — appropriate for reference/background content where no authoritative single source exists to cite, as opposed to live prices (handled by the tool, not RAG).

**Ingestion**: TODO(team) — run `RAGloader/RAG_loader_pipeline.ipynb` against these four files with your own Pinecone/API keys (the files are gitignored by design per `RAGloader/content/README.md` and must be ingested locally, not committed). Document here once run: chunking/parent-child settings used, and any quality checks performed (e.g. does `vectorDatabaseSearch` return the FAQ for a "what does this do" query).

**Retrieval config** (inherited from myAI6, unchanged): Pinecone index `myai6`, parent-child 3-namespace retrieval (children/parents/propositions), `PINECONE_TOP_K=20`, `PINECONE_MIN_SCORE=0.1` — see `config.ts`.

### C3. How each new feature was built

**Arbitrage calculator** (`app/api/chat/tools/arbitrage.ts`): a Vercel AI SDK `tool()` with a zod input schema (`originDistrict`, `quantityKg`, `freightPerKm`). On call: resolves the origin district by name (`lib/districts.ts` `findDistrict`, with a small alias table for common city names like "Vijayawada"), builds the candidate list (origin + its defined neighbors), and for each candidate fetches a price via Exa search (`getExa()` reused from `web-search.ts`) with a regex-based extractor (`extractPricePerQuintal`) that looks for "₹/Rs per quintal/qtl" patterns and sanity-bounds the result (₹1,200–5,500/quintal) before trusting it; anything unparsable or out of range falls back to `lib/districts.ts`'s seeded `fallbackPricePerQuintal`. Distance uses the Haversine formula on static lat/long centroids times a fixed 1.35 road-distance fudge factor (`ROAD_DISTANCE_FACTOR`). Net profit = `(pricePerQuintal/100) * quantityKg - freightPerKm * distanceKm`, matching the team's original brief formula. Non-obvious decision: price sourcing is Exa + regex heuristics, not a dedicated Agmarknet scraper/API integration — a deliberate scope cut for a weekend build (see C6).

**Guided intake + result cards**: `components/arbitrage-intake-form.tsx` is a small controlled form (shadcn `Select`/`Input`) that composes one natural-language message ("I'm in X. I have Y of paddy/rice... freight is ₹Z/km...") and calls the same `sendMessage` the free-text box uses — no new backend endpoint needed. `components/messages/arbitrage-card.tsx` renders the tool's structured JSON output (not the model's prose) as a ranked list of districts with price/distance/freight/net-profit, highlighting the recommended one; wired in by checking `part.type === "tool-arbitrageCalculator"` in `components/messages/assistant-message.tsx`, alongside the existing generic `ToolResult` status line.

### C4. Interface and experience

Changed: `app/page.tsx` welcome message and header title (`config.ts` `WELCOME_MESSAGE`, `BROWSER_TAB_TITLE`), added the guided intake form (shown only at the start of a fresh conversation, so returning users mid-conversation aren't blocked by it), added the arbitrage result card, added a rotating "Checking mandi prices / Calculating freight costs" status label for the new tool (`lib/fun-labels.ts`, `components/messages/tool-call.tsx`) so the busy/loading state reads naturally rather than showing a generic "Processing" label. Tied to A2: the target user is a busy merchant, not a researcher, so the form defaults to quintals (the unit merchants actually use) with a kg option, and the result card leads with the recommended district rather than a data table the user has to interpret themselves.

### C5. Behavior and guardrails

`prompts.ts` `IDENTITY_PROMPT`/`ARBITRAGE_PROMPT` scope the assistant to paddy/rice arbitrage for the 16 supported AP/Telangana districts; it declines other crops, other regions, and general trading/investment/speculation advice. It is instructed to never state a price or distance not grounded in a tool/KB/web result, to always label each price live vs. reference with its date, and to always close an arbitrage answer with a reminder to confirm the destination mandi's price before shipping. Citations, moderation (`lib/moderation.ts`, unchanged, `MODERATION_PROVIDER` env-controlled), and rate limiting (`middleware.ts`, unchanged) are all kept on per the assignment's non-negotiables.

### C6. Testing and known limitations

TODO(team): replace this section with what you actually observed testing the deployed app — this is the pre-testing expectation based on the code, not a substitute for real testing.

Expected to work well: the full flow for a supported district with a plausible quantity/freight input; graceful decline for unsupported districts/crops; the fallback price path when Exa is unavailable or misconfigured (the tool never throws, it always returns fallback data).

Known limitations going in:
- **Price extraction is heuristic.** Regex-based extraction from arbitrary scraped page text is fragile — a page that states its price in an unusual format may fail to parse and silently fall back to reference data. The tool always labels which happened, so the user is never misled, but "live" data may end up rare in practice. A proper Agmarknet API integration or a structured scraper (the team's original Vercel Cron + Postgres design) would fix this and is the natural next step.
- **Distance is an approximation.** Static district centroids + a fixed 1.35 road-distance multiplier is not real routing — actual road distance for a specific pair of towns can differ meaningfully. A real directions API (Google Maps/Mapbox) would fix this at the cost of an API key and per-call cost.
- **District adjacency is simplified**, not a computed GIS boundary check — a few real neighboring districts may be missing from a given district's candidate list, and vice versa.
- **No grading/moisture/variety input** — the tool uses one reference price per district regardless of paddy quality, per `rice-grading-basics.md`.
- **No mandi commission/handling fees** in the net-profit figure — see `transport-cost-benchmarks.md`.

TODO(team): test with 10 real questions from people outside the team (per the assignment) and record failures found/fixed here.

### C7. Running and deploying

**Environment variables** (names only — see `env.template`; no values ever committed): `ANTHROPIC_API_KEY` (required — chat model, moderation, compaction), `PINECONE_API_KEY` (required unless `ENABLE_VECTOR_SEARCH=false`), `EXA_API_KEY` (required for both `webSearch` and the arbitrage tool's live price fetch — without it, arbitrage still works, always via fallback data), optionally `OPENAI_API_KEY`, `FIREWORKS_API_KEY`, `SUMMARY_HMAC_SECRET`, `HEALTH_CHECK_TOKEN`. No new environment variables were introduced by MandiMargin's features — the arbitrage tool reuses `EXA_API_KEY`.

**Setup**: `npm install`, copy `env.template` to `.env.local` and fill in keys, `npm run dev` for local development.

**Deploying**: TODO(team) — document your actual Vercel project setup once deployed (project name, any Vercel env vars set beyond `.env.local`, spending limit configured, and confirmation that rate limiting/moderation are on in production).

## Part D — Team and disclosure

### D1. Team

TODO(team): team name, the four members, and each member's contribution.

### D2. Generative AI disclosure

TODO(team) — complete truthfully. Starting point given how this build actually happened:

> "We used Claude (Anthropic) for [drafting the arbitrage tool implementation, the district reference dataset, the guided-intake/result-card UI, the prompt rewrite, and this documentation skeleton — fill in exactly what your team used it for and what you did yourselves]. The AI contributed [X% estimate] to this work. All ideas, analysis, and final conclusions are our own. We verified all AI-generated content for accuracy."

Cite AI-generated code or text of substance where it appears — TODO(team): add specific file-level notes if your instructor's honor-code interpretation expects them.
