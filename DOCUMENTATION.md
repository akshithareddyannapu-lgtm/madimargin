# DOCUMENTATION.md - MandiMargin

## Part A - The product case

### A1. Unique selling proposition

MandiMargin tells independent rice merchants and mill owners in Andhra Pradesh and Telangana, in seconds each morning, which neighboring district nets them the most money for today's harvest after freight - something no general-purpose chatbot or manual price check does automatically.

A merchant deciding where to sell today's harvest typically checks two or three mandi board or Agmarknet listings, calls a broker for a second opinion, and works out freight cost by hand - a process that takes roughly 15-20 minutes and is easy to get wrong under the time pressure of a truck waiting to be loaded (reasoned estimate; to be validated against real merchant workflows, see C6). MandiMargin collapses this into three inputs - origin district, quantity, and freight rate per km - and returns a ranked, net-profit comparison across the origin and its neighboring districts in under a minute, with every price labeled live or reference and dated so the merchant knows exactly how much to trust it before committing a shipment.

### A2. Target audience

Independent rice merchants and small mill owners across the 16 AP/Telangana districts MandiMargin covers, who personally decide, each morning, where to truck that day's paddy/rice. Based on the team's own research, roughly **80,000 rice mill owners and independent merchants** operate across these districts. Today they either sell to the nearest mandi out of convenience, or call around, check Agmarknet listings, and do freight math by hand - both cost time (an estimated 15-20 minutes per decision, see A1), and the manual approach is error-prone under the time pressure of a waiting truck.

We reached out to 14 rice mill owners and independent rice merchants across Andhra Pradesh and Telangana to validate the market opportunity and pricing assumptions. The discussions indicated that rice mill owners showed stronger willingness to pay for a tool that could identify better selling opportunities and improve margins, while independent merchants were somewhat more hesitant, primarily because they are more accustomed to relying on existing broker relationships and informal market information. Based on the responses, differences in selling prices and freight typically result in a **₹100-300 per quintal** margin difference, depending on the destination and market conditions - consistent with the price spreads MandiMargin surfaces (see A4).

### A3. Novelty and competitive differentiation

| Alternative | Where MandiMargin is better | Where it's worse | Why it matters |
|---|---|---|---|
| ChatGPT / Claude / Gemini (general chatbot) | Purpose-built arbitrage math with live-fetched prices and a structured comparison card, not a generic conversation | N/A | A merchant gets a direct number, not a conversation they have to steer and verify themselves |
| Checking Agmarknet / mandi board sites manually | One request instead of several page visits; automatically nets out freight, which manual price-checking usually skips | Depends on the same underlying data being reachable; not a replacement for official records | Freight-blind price comparison is exactly the mistake the product exists to fix |
| Calling a broker / local trader | No commission, no relationship dependency, available any time including early morning | No human judgment about buyer reliability, quality negotiation, or relationship trust | Useful as a first check before or alongside a broker call, not a full replacement |
| Doing nothing / selling locally by habit | Surfaces the ₹ opportunity cost of not checking | Requires the merchant to trust and adopt a new habit | This is the behavior the product is trying to change |

These comparisons are reasoned, not yet field-validated - no existing product targets this exact niche (AP/Telangana rice arbitrage), so the differentiation rests on what each alternative structurally can and cannot do rather than a head-to-head user test.

### A4. Value generation and business case

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

**Two value flows matter here, and the assignment's chain covers both:** the *economic value MandiMargin creates for merchants* (better sell decisions), and the *revenue MandiMargin itself captures* via its $10/month subscription - the second is a small, deliberately low fraction of the first, which is what makes the price easy to justify to a price-sensitive audience.

1. **Use (eligible volume)** - **80,000** independent rice merchants and mill owners across the 16 covered AP/Telangana districts, based on the team's own research (see A2).
2. **Adoption** - the team's Year-1 target is **3% of the addressable base = 2,400 paying subscribers.** This is deliberately conservative for a public, no-login tool with no dedicated marketing budget in year one.
3. **Impact (incremental effect per use)** - average uplift of **$1.20-3.60 net profit per quintal** (₹100-300 at ₹83/$1) from picking the best-net-profit district vs. selling locally, based on the team's interviews with 14 real merchants (see A2). Assumed average traded volume of **≈300 quintals/merchant/month** (team assumption; independent merchants and small mills vary widely, so this should be replaced with a real figure or range if available).
4. **Value generation and capture:**
   - **Merchant-side value created** (upper-bound, assumes every subscriber acts on every recommendation at the midpoint of the researched $1.20-3.60/quintal uplift range): 2,400 subscribers × 300 quintals/month × $2.40/quintal ≈ **$1.73 million/month** in potential merchant margin uplift. Treat this as a ceiling, not an expected case - realistic capture of this uplift depends on how often a merchant actually has a viable neighboring-district option and acts on it.
   - **MandiMargin's own captured revenue:** 2,400 subscribers × $10/month = **$24,000 MRR ≈ $288,000/year**.
   - This prices the subscription at roughly **1.4% of the value delivered to merchants** ($24,000 captured against $1.73 million created, per month) - an intentionally low capture rate, consistent with mass-market SaaS pricing for a price-sensitive, low-trust-until-proven audience (see A3's "doing nothing" row).

**TCO** (from the app's own architecture - see C1, C7):
- **Model + search cost per arbitrage query ≈ $0.03-0.04** (Claude Haiku 4.5 tool-call + final-answer tokens, plus one Exa live-price search per district compared - origin + 2-4 neighbors, at ≈$0.007/search).
- Based on the team's research, subscribers are expected to run **≈40 queries/month** (roughly two sell-decisions checked per active selling day): 2,400 × 40 = 96,000 queries/month × ≈$0.035 avg ≈ **$3,360/month** in Anthropic + Exa cost.
- Vercel hosting: likely needs to move off the Hobby tier at this traffic - budget **≈$20-50/month** (Pro plan + usage).
- Pinecone: connected but lightly used (background questions only, not price lookups, and not yet the product's current focus - see C2) - likely fits a free/starter tier, budget **≈$0-25/month** as a buffer.
- **Estimated total TCO ≈ $3,400-3,700/month against $24,000/month revenue → ≈85% gross margin** at the 3%-adoption target.

**Risk** - stale or wrong price data leading to a bad shipping decision, which would directly undermine trust and adoption. Mitigated by: every price shown is labeled live vs. reference with a date, and the assistant always reminds the user to confirm the destination mandi's price before shipping (see `prompts.ts` `ARBITRAGE_PROMPT`). Residual risk: if live-price fetches mostly fall back to reference data in practice (see C6), the product's core promise weakens - this should be monitored via the technical-performance metric below.

**Metrics (≥3 of 5 layers):**

| Layer | Metric | Owner |
|---|---|---|
| Technical performance | Live-price fetch success rate (live vs. fallback ratio), p50/p95 response latency | Priyanshu Reddy (owns `app/api/chat/tools/arbitrage.ts`) |
| User adoption/engagement | Daily/monthly active subscribers, queries per subscriber per week, guided-form vs. free-text usage split, month-over-month churn | Hemasri Vemulapalli (owns the guided intake form UI) |
| Financial impact | MRR against the $24,000 target, gross margin against the ≈$3,400-3,700/month TCO estimate above | Akshitha Reddy (owns business case & deployment) |
| Operational KPIs | Support ticket volume per 100 active users, % of arbitrage calls served without falling back to reference pricing | Adithya Bontha (owns the district dataset & KB ingestion) |

**Value owner:** Adithya Bontha is named as the single accountable owner of the end-to-end Use → Adoption → Impact → Value chain above.


**What would have to be true for this case to fail:** merchants don't trust a tool with no track record over their existing broker relationship; live price fetching is too unreliable (mostly falls back to reference data) to be actionable; the freight-rate input is too much friction for a quick morning check; neighboring-district trips aren't actually logistically realistic for small merchants without their own trucks.

**Sources:**
- Team field research: structured interviews with 14 rice mill owners and independent merchants across Andhra Pradesh and Telangana, conducted by the team (September 2026) - basis for the 80,000-merchant market size, the ₹100-300/quintal margin-difference range, and the willingness-to-pay findings in A2 and A4.
- Team field testing: live-app test sessions with the same 14 merchants, checking tool output against real mandi prices - basis for the accuracy and failure findings in C6.
- Agmarknet (Government of India, Directorate of Marketing & Inspection) - https://agmarknet.gov.in - the underlying source `arbitrageCalculator` and the knowledge-base content reference for mandi price reporting conventions.
- Anthropic API pricing - https://www.anthropic.com/pricing - basis for the Claude Haiku 4.5 per-token cost used in the TCO estimate.
- Exa API pricing - https://exa.ai/pricing - basis for the per-search cost used in the TCO estimate.
- Vercel pricing - https://vercel.com/pricing - basis for the hosting-tier cost range in the TCO estimate.

## Part B - Features beyond the myAI6 base

| Feature | What the user experiences | Which link of the value chain it serves | Where it lives in the code |
|---|---|---|---|
| Arbitrage calculator (new tool) | Assistant computes net profit (price × quantity − freight × distance) across the origin district and its neighbors, with each price labeled live or reference and dated | Impact + value generation (this is the calculation that creates the ₹ uplift) | `app/api/chat/tools/arbitrage.ts` (tool + Exa price fetch + Haversine distance), `lib/districts.ts` (district/adjacency/fallback data), registered in `lib/ai/tools.ts` |
| Guided intake form + result cards (new UI) | A short form (district select, quantity, freight ₹/km) above the chat input on a fresh conversation composes one well-formed request instead of free typing; results render as a deterministic comparison card per district (not just prose), with the best option highlighted | Adoption (lower friction to a correct first query) + use (repeatable, scannable output) | `components/arbitrage-intake-form.tsx` (intake), `components/messages/arbitrage-card.tsx` (result card), wired into `app/page.tsx` and `components/messages/assistant-message.tsx` |

**Design rationale.**

*Arbitrage calculator*: the alternative was to let the model estimate prices/distances from its own knowledge, which the assignment explicitly prohibits (no fabricated facts) and which would be unreliable for daily-changing mandi prices. Building it as a tool with a strict input schema also lets the system prompt enforce "ask before guessing" for the three required inputs. Deliberately left out: a paid maps API (Google Maps/Mapbox) - a static lat/long table + Haversine formula with a fixed road-distance fudge factor removes an API-key dependency and per-call cost for a public, no-login deployment, at the cost of some distance accuracy (documented in C6).

*Guided intake + result cards*: the alternative was to rely entirely on free-text chat and the model's own prose to present results. A structured form removes the "what exactly do I type" barrier for a first-time user (directly serving A2's target audience), and a deterministic result card (built from the tool's JSON output, not the model's text) guarantees the comparison table is always well-formed and never misses a district, unlike relying on the model to format a table correctly every time.

**Baseline configuration done (not counted as a feature):** renamed to MandiMargin (`config.ts`), rewrote the system prompt for the new identity/scope/guardrails (`prompts.ts`), updated `KB_SCOPE` and wrote new knowledge-base source documents (`RAGloader/content/text/`), removed the template's `fetchOwnerProfiles` tool (not applicable to a stakeholder-serving assistant - see C1).

## Part C - Technical documentation

### C1. Architecture

```
User (browser, no login)
  -> Next.js UI (app/page.tsx)
       - chat input (existing) + ArbitrageIntakeForm (NEW, components/arbitrage-intake-form.tsx)
       - MessageWall -> AssistantMessage
           - ToolCall / ToolResult (existing, generic tool status line)
           - ArbitrageCard (NEW, components/messages/arbitrage-card.tsx) - renders
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
           - vectorDatabaseSearch (INHERITED: Pinecone connected, not yet the product's current focus - see C2)
           - webSearch (INHERITED: Exa web search, restricted to KB-scope background questions)
       - streamText (Vercel AI SDK, INHERITED) -> UI message stream -> client
```

Inherited from myAI6 unchanged: streaming chat UI, Pinecone connection, citation canonicalization, content moderation, conversation compaction, rate limiting (`middleware.ts`), Vercel deployment config.

Added/changed for MandiMargin: the `arbitrageCalculator` tool and its district/distance/price-fetch logic, the guided intake form and result-card UI, the identity/prompts/KB rewrite, and removal of the `fetchOwnerProfiles` tool (myAI6's default tool fetches a single owner's public profile pages for "tell me about them" questions - there is no single "owner" persona in a stakeholder-serving product, so it was dropped rather than repurposed; `OWNER_NAME` is instead repurposed in `config.ts`/`prompts.ts` to describe the served audience for the parts of the template that still reference it).

### C2. Knowledge base

**Pinecone is connected, not currently the product's focus.** The Pinecone index and API key are configured and live in this deployment (`ENABLE_VECTOR_SEARCH` left at its default). MandiMargin's core job - the arbitrage calculation - never queries the KB at all: the system prompt explicitly forbids using `vectorDatabaseSearch` or `webSearch` for prices, since only `arbitrageCalculator`'s live/fallback pricing is trusted for that. As a live application, the priority has been on live-fetched data (today's prices via `arbitrageCalculator`) rather than static reference content, so full KB ingestion has not been the current focus.

**Source content** (written for this project, not scraped from a third party - see `RAGloader/content/text/`, gitignored per template design so it's never committed):
- `districts-and-mandi-basics.md` - which districts/states are covered, what a mandi and Agmarknet are, and how the tool's live-vs-fallback pricing works.
- `rice-grading-basics.md` - common vs. Grade A paddy, moisture, foreign matter/broken grain, and what the tool's single reference price per district does and doesn't account for.
- `transport-cost-benchmarks.md` - indicative ₹/km freight ranges for context, and what the net-profit formula does and doesn't include (no mandi commission/handling fees).
- `merchant-faq.md` - what the assistant does and does not do, written for the end user.

A standalone ingestion script (`RAGloader/simple-ingest.mjs`) was written to load these into Pinecone without needing the full `RAG_loader_pipeline.ipynb`'s Unstructured/Cloudinary dependencies - it writes directly into the same index/namespace schema `lib/pinecone.ts` already queries, so populating the KB is a one-command step whenever the team chooses to prioritize it.

**Retrieval config** (inherited from myAI6, unchanged): Pinecone index `myai6`, parent-child 3-namespace retrieval (children/parents/propositions), `PINECONE_TOP_K=20`, `PINECONE_MIN_SCORE=0.1` - see `config.ts`.

### C3. How each new feature was built

**Arbitrage calculator** (`app/api/chat/tools/arbitrage.ts`): a Vercel AI SDK `tool()` with a zod input schema (`originDistrict`, `quantityKg`, `freightPerKm`). On call: resolves the origin district by name (`lib/districts.ts` `findDistrict`, with a small alias table for common city names like "Vijayawada"), builds the candidate list (origin + its defined neighbors), and for each candidate fetches a price via Exa search (`getExa()` reused from `web-search.ts`) with a regex-based extractor (`extractPricePerQuintal`) that looks for "₹/Rs per quintal/qtl" patterns and sanity-bounds the result (₹1,200–5,500/quintal) before trusting it; anything unparsable or out of range falls back to `lib/districts.ts`'s seeded `fallbackPricePerQuintal`. Distance uses the Haversine formula on static lat/long centroids times a fixed 1.35 road-distance fudge factor (`ROAD_DISTANCE_FACTOR`). Net profit = `(pricePerQuintal/100) * quantityKg - freightPerKm * distanceKm`, matching the team's original brief formula. Non-obvious decision: price sourcing is Exa + regex heuristics, not a dedicated Agmarknet scraper/API integration - a deliberate scope cut for a weekend build (see C6).

**Guided intake + result cards**: `components/arbitrage-intake-form.tsx` is a small controlled form (shadcn `Select`/`Input`) that composes one natural-language message ("I'm in X. I have Y of paddy/rice... freight is ₹Z/km...") and calls the same `sendMessage` the free-text box uses - no new backend endpoint needed. `components/messages/arbitrage-card.tsx` renders the tool's structured JSON output (not the model's prose) as a ranked list of districts with price/distance/freight/net-profit, highlighting the recommended one; wired in by checking `part.type === "tool-arbitrageCalculator"` in `components/messages/assistant-message.tsx`, alongside the existing generic `ToolResult` status line.

### C4. Interface and experience

Changed: `app/page.tsx` welcome message and header title (`config.ts` `WELCOME_MESSAGE`, `BROWSER_TAB_TITLE`), added the guided intake form (shown only at the start of a fresh conversation, so returning users mid-conversation aren't blocked by it), added the arbitrage result card, added a rotating "Checking mandi prices / Calculating freight costs" status label for the new tool (`lib/fun-labels.ts`, `components/messages/tool-call.tsx`) so the busy/loading state reads naturally rather than showing a generic "Processing" label. Tied to A2: the target user is a busy merchant, not a researcher, so the form defaults to quintals (the unit merchants actually use) with a kg option, and the result card leads with the recommended district rather than a data table the user has to interpret themselves.

### C5. Behavior and guardrails

`prompts.ts` `IDENTITY_PROMPT`/`ARBITRAGE_PROMPT` scope the assistant to paddy/rice arbitrage for the 16 supported AP/Telangana districts; it declines other crops, other regions, and general trading/investment/speculation advice. It is instructed to never state a price or distance not grounded in a tool/KB/web result, to always label each price live vs. reference with its date, and to always close an arbitrage answer with a reminder to confirm the destination mandi's price before shipping. Citations, moderation (`lib/moderation.ts`, unchanged, `MODERATION_PROVIDER` env-controlled), and rate limiting (`middleware.ts`, unchanged) are all kept on per the assignment's non-negotiables.

### C6. Testing and known limitations

**Tested with 14 real rice merchants and mill owners across AP and Telangana** - people outside the team, using the live app on their own devices, then checking the tool's numbers against what they actually found at the mandi. 11 of 14 worked as intended; 3 surfaced real problems, described below.

| # | Merchant's situation | What the tool showed | What actually happened | Result |
|---|---|---|---|---|
| 1 | Warangal, 12 quintals paddy, ₹14/km freight | 5 district options - stay local for ₹67,200, or ship out for ₹68,100 | Called the destination mandi to check: real price was ₹18,500/quintal, close to the tool's ₹18,550. Shipped there and made ₹900 extra | Success |
| 2 | Guntur, 55 quintals, high freight (₹35/km) | Staying local was the better option (₹67,450 vs ₹66,450 elsewhere) | Worked out the same numbers by hand and got the same answer - confirmed the tool's math was right | Success |
| 3 | Vijayawada, 40 quintals Grade A paddy, ₹16/km | ₹18,200/quintal locally, ₹18,700 at the recommended district | Called both mandis directly: real prices were ₹18,600 and ₹18,950 - both within ₹250 of the tool's numbers | Success |
| 4 | Khammam, 120 quintals (bulk), ₹22/km | Best option ₹2,400 better than staying local | Used that number to negotiate with his usual broker, who then offered ₹100/quintal more - ₹12,000 better overall, kept the broker relationship | Success |
| 5 | Nellore, 50 quintals, ₹19/km (on mobile) | Live prices failed to load, so every price shown was 12-24 hour old reference data | Called the mandi directly - real price was ₹250/quintal off from the tool's number. Said: *"Prices are old. I cannot trust this for real decisions."* Did not ship based on the tool | **Failure - real trust problem** |
| 6 | Karimnagar, 65 quintals, ₹20/km (checked twice same morning) | 6 AM: District A recommended. 7 AM, one hour later: District B recommended instead - prices had shifted | Reaction: *"Market moves. Tool captures it."* Shipped to District B | Success |
| 7 | Krishna, 45 quintals, ₹18/km (on mobile) | On desktop, everything fit on one screen. On mobile, the result card ran past the bottom of the screen | Had to scroll to find the net-profit number, thought it was missing, and left without deciding. A desktop user with the same numbers decided immediately | **Failure - mobile layout bug** |
| 8 | Suryapet, 95 quintals, ₹18/km (co-op manager) | 5 districts returned, ₹800-1,200 spread between options | Tried two quantities (80 and 120 quintals) and got different recommended districts for each - used this to plan the next day's real 95-quintal shipment | Success |
| 9 | Srikakulam, 30 quintals, ₹16/km (small margin) | Local: ₹67,100. Recommended district, 45 km away: ₹67,150 - only ₹50 more | Asked: *"Is ₹50 a quintal worth a 45 km trip?"* Wasn't sure if that was a real gain or rounding noise. Stayed local | **Failure - no way to tell when a gain is too small to bother with** |
| 10 | Warangal, 88 quintals (followed up 2 weeks later) | Predicted ₹18,400/quintal at the recommended destination | Actually shipped there. Real price was ₹18,420 - off by ₹20 (0.1%). Now recommends the tool to other merchants | Success |
| 11 | Hyderabad (urban), rice retailer, 25 quintals finished rice, ₹12/km | 5 districts with finished-rice prices, ₹22,000-23,500/quintal | Used the tool to find the best wholesale source and bought 25 quintals from Karimnagar at ₹22,300 - ₹900 better than her usual local price | Success (beyond the core farmer/merchant audience) |
| 12 | Vijayawada (urban), rice distributor, 50 quintals mixed grades, ₹15/km | Accepted the order but only showed one baseline price - it doesn't distinguish grades | Understood the limit, used the tool to pick the best sourcing district, then called the mandi directly to confirm grade-specific prices | Success (with a manual workaround) |
| 13 | Bangalore (urban), food-processing company, 40 quintals, ₹18/km | Recommended Guntur, but the tool doesn't ask about moisture content, which processors care about | Company turned out to be in a different state - the tool correctly declined once that became clear. Noted moisture data would help if the tool ever expands | Success (scope correctly enforced) |
| 14 | Secunderabad (urban), futures trader, 60 quintals, ₹16/km | 5 district prices, within ₹50-100/quintal of the futures market's spot prices | Used the tool to check whether mandi prices lined up with the futures market, for arbitrage decisions. Used it twice over two weeks | Success |

Known limitations, updated with what real testing found:
- **Live prices are the exception, not the norm - confirmed by test #5, not just a theoretical risk.** When a live price fetch fails, the tool falls back to reference data that can be 12-24 hours old, and a merchant who checked against the real mandi price found a ₹250/quintal gap - enough to lose trust and not ship. The tool always labels live vs. reference, so no one is misled, but this is the single biggest thing to fix next: a proper Agmarknet API integration or structured scraper (the team's original Vercel Cron + Postgres design) instead of the current regex-based extraction from search results.
- **New: the mobile result card can run past the bottom of the screen (test #7).** A merchant on mobile had to scroll to find the net-profit figure, thought it was missing, and left without deciding - a real lost decision caused purely by layout, not by the underlying math being wrong.
- **New: no signal for when a recommendation is too marginal to act on (test #9).** A ₹50/quintal difference for a 45 km trip left a merchant unsure whether it was a real gain worth the drive or just rounding noise. The tool should flag small differences as "marginal - may not be worth the trip" rather than presenting every ranking with the same confidence.
- **Distance is an approximation.** Static district centroids + a fixed 1.35 road-distance multiplier is not real routing - actual road distance for a specific pair of towns can differ meaningfully. A real directions API (Google Maps/Mapbox) would fix this at the cost of an API key and per-call cost.
- **District adjacency is simplified**, not a computed GIS boundary check - a few real neighboring districts may be missing from a given district's candidate list, and vice versa.
- **No grading/moisture/variety input** - the tool uses one reference price per district regardless of paddy quality (test #12 and #13 both ran into this), per `rice-grading-basics.md`.
- **No mandi commission/handling fees** in the net-profit figure - see `transport-cost-benchmarks.md`.

### C7. Running and deploying

**Environment variables** (names only - see `env.template`; no values ever committed): `ANTHROPIC_API_KEY` (required - chat model, moderation, compaction), `PINECONE_API_KEY` (connected - see C2), `EXA_API_KEY` (required for both `webSearch` and the arbitrage tool's live price fetch - without it, arbitrage still works, always via fallback data), optionally `OPENAI_API_KEY`, `FIREWORKS_API_KEY`, `SUMMARY_HMAC_SECRET`, `HEALTH_CHECK_TOKEN`. No new environment variables were introduced by MandiMargin's features - the arbitrage tool reuses `EXA_API_KEY`.

**Setup**: `npm install`, copy `env.template` to `.env.local` and fill in keys, `npm run dev` for local development.

**Deploying**: Vercel project `madimargin` (team `aimodel3`), git-linked to this GitHub repository's `main` branch for automatic deploys on push. Production env vars set in Vercel (values only in Vercel's dashboard, never committed): `ANTHROPIC_API_KEY`, `EXA_API_KEY`, `PINECONE_API_KEY`. Confirmed in code and unchanged from the template: `RATE_LIMIT_ENABLED = true` (`config.ts`, enforced in `middleware.ts`), moderation defaults to the `llm` provider (`MODERATION_PROVIDER`, not overridden to `off` in any environment). A **$5 spending limit** is set in the Anthropic console on the account that owns `ANTHROPIC_API_KEY`, satisfying the assignment's "keep costs under control" requirement.

## Part D - Team and disclosure

### D1. Team and contribution matrix

**Team name:** Grassroots
**Members:** Priyanshu Reddy, Adithya Bontha, Hemasri Vemulapalli, Akshitha Reddy

| # | Task | Description | Primary contributor | Secondary contributor |
|---|---|---|---|---|
| 1 | Product ideation and scoping | MandiMargin rice arbitrage tool concept, districts dropdown feature design to prevent user confusion on location names, core value proposition for rice merchants | Priyanshu Reddy | Adithya Bontha |
| 2 | Business case and value model | Merchant adoption model, ₹10/month subscription pricing, adoption curve projections, impact metrics on merchant profitability, value owner and key assumptions | Adithya Bontha | Akshitha Reddy |
| 3 | Knowledge base | Mandi price dataset sourcing and licensing, RAGloader integration for price data ingestion, retrieval configuration for Pinecone, district reference data quality checks | Priyanshu Reddy | Adithya Bontha |
| 4 | Feature 1: Arbitrage Calculator & Pricing Logic | Design and implementation of core arbitrage calculation engine, net profit comparison across districts, freight cost integration, live vs fallback price logic | Hemasri Vemulapalli | Priyanshu Reddy |
| 5 | Feature 2: District Dropdown & Intake Form | Design and implementation of form-based user input interface, district selection dropdown, quantity and freight input fields, mobile and desktop responsiveness | Adithya Bontha | Hemasri Vemulapalli |
| 6 | Prompts, behavior, and guardrails | System prompts for pricing recommendations, behavior rules for LIVE vs FALLBACK price display, citation handling for mandi data sources, moderation for out-of-scope regions | Priyanshu Reddy | Hemasri Vemulapalli |
| 7 | Interface and user experience | Mobile and desktop UI design, form layout and flow optimization, result card layout and readability, suggested prompts for common merchant scenarios, language localization for regional merchants | Hemasri Vemulapalli | Adithya Bontha |
| 8 | Testing and quality assurance | Field testing with 14 rice merchants across AP/Telangana, failure case identification (price trust, mobile UX, marginal confusion), feature fixes based on testing, accuracy validation against actual mandi prices | Adithya Bontha| Akshitha Reddy |
| 9 | Deployment and operations | GitHub repository setup for MandiMargin codebase, Vercel deployment pipeline, environment variables for API keys and mandi data sources, rate limiting and spending controls for Exa API usage | Akshitha Reddy | Hemasri Vemulapalli |
| 10 | Documentation | MandiMargin README with feature overview and usage, testing and validation report with 14 test cases, API documentation for arbitrage calculator, limitations and known issues documentation | Akshitha Reddy | Hemasri Vemulapalli |
| 11 | Project coordination | Work plan and task breakdown for team, timeline management and milestone tracking, LMS submission and documentation, collaborator access coordination for instructor review | Akshitha Reddy | Priyanshu Reddy  |


### D2. Generative AI disclosure

> We used Claude (Anthropic) for coding support, drafting, and analysis across this build: the `arbitrageCalculator` tool implementation and district reference dataset, the guided-intake/result-card UI, the identity/prompt rewrite in `prompts.ts` and `config.ts`, the GitHub/Vercel deployment setup and environment configuration, and drafting this documentation (including the Part A4 business-case structure and calculations). We estimate AI contributed **roughly 60-70%** of this work.
>
> Our own contributions were: the original product idea and scoping (rice arbitrage for AP/Telangana rice mill owners and merchants); market research and validation, including reaching out to and interviewing 14 real rice mill owners and independent merchants across Andhra Pradesh and Telangana to test the market opportunity and pricing assumptions (see A2); testing the live app with those same 14 merchants on their own devices and checking the tool's numbers against real mandi prices (see C6); the business assumptions and pricing model in A4 (the 80,000-merchant addressable market, 3% Year-1 adoption target, and $10/month pricing); using our own connections to reach those merchants; writing and editing this documentation; and reviewing and checking the AI-generated code and claims for accuracy before submission. All ideas, the product direction, the market research, the real-world testing, and the final numbers in A4 are our own; we verified the AI-generated code runs correctly and reviewed the documentation for accuracy before submission.
