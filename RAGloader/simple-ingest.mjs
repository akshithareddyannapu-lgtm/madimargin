// RAGloader/simple-ingest.mjs
//
// Lightweight, no-Unstructured alternative to RAG_loader_pipeline.ipynb for
// plain markdown source documents. Writes directly into the same Pinecone
// index/namespace/field schema that lib/pinecone.ts already queries
// (PINECONE_USE_PARENT_CHILD = true), so the app's existing code needs no
// changes. Skips the "propositions" namespace — lib/pinecone.ts already
// treats a missing propositions namespace as non-fatal.
//
// Usage:
//   PINECONE_API_KEY=your-key node RAGloader/simple-ingest.mjs
//
// Requires: @pinecone-database/pinecone (already a project dependency).

import { Pinecone } from "@pinecone-database/pinecone";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INDEX_NAME = "myai6";
const NS_CHILDREN = "children";
const NS_PARENTS = "parents";

// One entry per source document. source_name must be unique and stable —
// it's the citation key merchants' answers will reference (kb:<source_name>).
const DOCUMENTS = [
  {
    file: "content/text/districts-and-mandi-basics.md",
    source_name: "districts-and-mandi-basics",
    source_description:
      "Which districts/states MandiMargin covers, what a mandi and Agmarknet are, and how the tool's live-vs-fallback pricing works.",
  },
  {
    file: "content/text/rice-grading-basics.md",
    source_name: "rice-grading-basics",
    source_description:
      "Common vs. Grade A paddy, moisture, foreign matter/broken grain, and what the tool's single reference price per district does and doesn't account for.",
  },
  {
    file: "content/text/transport-cost-benchmarks.md",
    source_name: "transport-cost-benchmarks",
    source_description:
      "Indicative ₹/km freight ranges for context, and what the net-profit formula does and doesn't include.",
  },
  {
    file: "content/text/merchant-faq.md",
    source_name: "merchant-faq",
    source_description:
      "What MandiMargin does and does not do, written for the end user.",
  },
];

// Split on markdown headings first, then hard-wrap any very long section —
// simple and adequate for these short, well-structured reference docs.
function chunkMarkdown(text, maxChars = 1200) {
  const sections = text
    .split(/\n(?=#{1,3}\s)/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks = [];
  for (const section of sections) {
    if (section.length <= maxChars) {
      chunks.push(section);
      continue;
    }
    // Hard-wrap oversized sections on paragraph boundaries.
    const paras = section.split(/\n\n+/);
    let buf = "";
    for (const p of paras) {
      if ((buf + "\n\n" + p).length > maxChars && buf) {
        chunks.push(buf.trim());
        buf = p;
      } else {
        buf = buf ? buf + "\n\n" + p : p;
      }
    }
    if (buf.trim()) chunks.push(buf.trim());
  }
  return chunks;
}

async function main() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    console.error(
      "PINECONE_API_KEY is not set. Run: PINECONE_API_KEY=your-key node RAGloader/simple-ingest.mjs"
    );
    process.exit(1);
  }

  const pc = new Pinecone({ apiKey });
  const index = pc.Index(INDEX_NAME);

  const parentRecords = [];
  const childRecords = [];

  for (const doc of DOCUMENTS) {
    const fullPath = path.join(__dirname, doc.file);
    const fullText = readFileSync(fullPath, "utf-8");

    const parentId = `${doc.source_name}::parent`;
    parentRecords.push({
      id: parentId,
      content: fullText,
    });

    const chunks = chunkMarkdown(fullText);
    chunks.forEach((chunkText, i) => {
      childRecords.push({
        id: `${doc.source_name}::child::${i}`,
        text: chunkText,
        parent_id: parentId,
        chunk_type: "text",
        source_url: `kb:${doc.source_name}`,
        source_name: doc.source_name,
        source_description: doc.source_description,
        order: i,
      });
    });

    console.log(`Prepared ${doc.source_name}: 1 parent, ${chunks.length} children`);
  }

  console.log(`Upserting ${parentRecords.length} parent records...`);
  await index.namespace(NS_PARENTS).upsertRecords(parentRecords);

  console.log(`Upserting ${childRecords.length} child records...`);
  await index.namespace(NS_CHILDREN).upsertRecords(childRecords);

  console.log("Done. Give Pinecone a few seconds to finish indexing, then test with:");
  console.log(
    `  node -e "import('@pinecone-database/pinecone').then(async ({Pinecone}) => { const pc = new Pinecone({apiKey: process.env.PINECONE_API_KEY}); const idx = pc.Index('${INDEX_NAME}'); const r = await idx.namespace('${NS_CHILDREN}').searchRecords({query:{inputs:{text:'what is a mandi'}, topK: 3}, fields:['text','source_name']}); console.log(JSON.stringify(r, null, 2)); })"`
  );
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
