import { type ToolSet } from "ai";
import { createWebSearch } from "@/app/api/chat/tools/web-search";
import { createVectorDatabaseSearch } from "@/app/api/chat/tools/search-vector-database";
import { createArbitrageCalculator } from "@/app/api/chat/tools/arbitrage";
import {
  ENABLE_WEB_SEARCH,
  ENABLE_VECTOR_SEARCH,
  MAX_KB_SEARCHES,
  MAX_WEB_SEARCHES,
} from "@/config";
import type { UISource } from "@/types/data";

/** Collector callback: the source plus its retrieved text (for claim verification). */
export type CollectSource = (s: UISource, content?: string) => void;

/**
 * Assembles the enabled tool set. `collect` is called by each tool for every
 * source it uses, feeding the code-rendered Sources box; the optional content
 * is the text the model saw, used to verify citation claims. Pass a no-op to
 * ignore sources.
 *
 * Note: myAI6's default `fetchOwnerProfiles` tool (fetches a person's public
 * profile pages) does not apply to MandiMargin's stakeholder-serving use
 * case, so it is deliberately not included here (see DOCUMENTATION.md Part
 * C1). `arbitrageCalculator` is always available — it is the product's core
 * feature, independent of the KB/web-search feature switches.
 */
export function buildToolSet(collect: CollectSource = () => {}): ToolSet {
  return {
    arbitrageCalculator: createArbitrageCalculator(collect),
    ...(ENABLE_VECTOR_SEARCH ? { vectorDatabaseSearch: createVectorDatabaseSearch(collect) } : {}),
    ...(ENABLE_WEB_SEARCH ? { webSearch: createWebSearch(collect) } : {}),
  };
}

export function buildToolGuidance(): string {
  const sections: string[] = [];

  sections.push(
    `TOOL BUDGET (limits per response):
- arbitrageCalculator: call it once you have all three inputs (origin district, quantity, freight per km). If one is missing, ASK for it in plain language first — never guess a number. Call it again only if the user changes an input.`
  );

  if (ENABLE_VECTOR_SEARCH) {
    sections.push(
      `- vectorDatabaseSearch: MAX ${MAX_KB_SEARCHES} calls. Usually 1 is enough. Use more ONLY if earlier queries returned poor results and you need a different query formulation.`
    );
    if (ENABLE_WEB_SEARCH) {
      sections.push(
        `- webSearch: MAX ${MAX_WEB_SEARCHES} calls. RESTRICTED to supplementing KB results on the SAME topic only:
  a. You MUST have searched the knowledge base first AND received relevant results.
  b. ONLY use webSearch if the user explicitly asks about recent developments on a topic the KB covers.
  c. NEVER use webSearch for topics unrelated to the knowledge base. This is NOT a general search engine.
  d. Prefer a single webSearch call with 2-3 additionalQueries over several separate calls. Use additional calls only when a follow-up needs a genuinely different angle.
- ALWAYS search the knowledge base FIRST before using web search. Do not use both simultaneously.`
      );
    }
    sections.push(
      `- After receiving tool results, compose your final answer. Do NOT search again for the same information.

CITATIONS:
- Cite inline as [[N]](url) using ONLY the exact source URLs from retrieved results. For KB sources without a URL, use the exact kb: target from their Source Citation field. NEVER fabricate or guess URLs.
- Citations are pure markers: every sentence must read completely with citations removed. Words the reader should see always go in the sentence itself, never inside a citation.
- Cite each fact to the source it ACTUALLY came from. KB documents are dated snapshots — never cite them for facts newer than their date.
- Do NOT write a References or Sources section — the app renders a Sources box automatically from your inline citations.`
    );
  } else {
    sections.push(
      `NOTE: The knowledge base is currently UNAVAILABLE. Ignore any instructions to search it. Answer general (non-arbitrage) questions from your general knowledge.`
    );
    if (ENABLE_WEB_SEARCH) {
      sections.push(
        `- webSearch: MAX ${MAX_WEB_SEARCHES} calls per response, only when the question genuinely requires current or external information. Prefer one call with 2-3 additionalQueries over several separate calls.
- Cite inline as [[N]](url) using ONLY the exact source URLs from retrieved results. NEVER fabricate or guess URLs. Every sentence must read completely with citations removed.
- Do NOT write a References or Sources section — the app renders a Sources box automatically from your inline citations.`
      );
    }
  }

  sections.push(
    `IMPORTANT:
- Model and vendor selection are controlled by the administrator backend.`
  );

  return sections.join("\n\n").trim();
}
