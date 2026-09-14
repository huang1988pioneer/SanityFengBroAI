import { Head } from "$fresh/runtime.ts";
import SanityMigrate from "../islands/SanityMigrate.tsx";
import { shellBootScript } from "../lib/workbench.ts";

/**
 * SANITY_SETUP.md 從一開始就叫使用者「訪問 /migrate」，但這一頁沒有被實作。
 *
 * 版面用 static/styles.css 已有的殼層權杖（--sheet、--ink、--clay…）與共用
 * 按鈕類，只有 .migrate-* 是這一頁自己的，所以工作台換皮時這裡會跟著換。
 */
const pageStyles = `
.migrate-page {
  /* styles.css 用 fixed 的 body::before / ::after 鋪底紋，兩者都是 z-index: 0，
     所以這一頁跟 .app-shell 一樣要抬到 1，否則整頁會被壓在底紋下面。 */
  position: relative;
  z-index: 1;
  max-width: 68rem;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2.5rem);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: var(--ink);
}
.migrate-head {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
}
.migrate-head h1 {
  margin: 0.25rem 0;
  font-size: clamp(1.4rem, 3vw, 2rem);
}
.migrate-crumb {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--quiet);
}
.migrate-lede {
  margin: 0;
  max-width: 46rem;
  line-height: 1.7;
  color: var(--quiet);
}
.migrate-lede code {
  background: var(--quiet-fill);
  border-radius: var(--radius-xs);
  padding: 0.05em 0.3em;
}
.migrate-card {
  background: var(--sheet);
  color: var(--sheet-ink);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-2xl);
  padding: clamp(0.9rem, 2vw, 1.4rem);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.migrate-card-head h2 {
  margin: 0 0 0.2rem;
  font-size: 1rem;
  letter-spacing: 0.02em;
}
.migrate-card-head p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--quiet);
}
.migrate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 0.75rem;
}
.migrate-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}
.migrate-file {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  min-height: 2.25rem;
}
.migrate-filename {
  font-size: 0.8rem;
  color: var(--quiet);
  overflow-wrap: anywhere;
}
.migrate-csv {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  white-space: pre;
  overflow-x: auto;
}
.migrate-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--quiet);
}
.migrate-alert {
  margin: 0;
  padding: 0.55rem 0.7rem;
  border-radius: var(--radius);
  font-size: 0.85rem;
  border-left: 3px solid var(--hairline);
}
.migrate-alert.bad {
  background: rgba(194, 42, 72, 0.1);
  border-left-color: var(--danger);
}
.migrate-alert.warn {
  background: var(--warn-mist);
  border-left-color: var(--warn);
}
.migrate-chips {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  align-items: center;
}
.migrate-chips strong {
  font-size: 0.78rem;
  color: var(--quiet);
  margin-right: 0.25rem;
}
.migrate-chip {
  font-size: 0.75rem;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-xs);
  border: 1px solid var(--hairline);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.migrate-chip em {
  font-style: normal;
  opacity: 0.75;
  margin-left: 0.2rem;
}
.migrate-chip.ok {
  background: var(--ok-mist);
  border-color: var(--ok);
}
.migrate-chip.bad {
  background: rgba(194, 42, 72, 0.1);
  border-color: var(--danger);
}
.migrate-chip.mute {
  background: var(--quiet-fill);
  color: var(--quiet);
}
.migrate-scroll {
  overflow-x: auto;
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
}
.migrate-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.8rem;
}
.migrate-table th,
.migrate-table td {
  text-align: left;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--hairline);
  white-space: pre-wrap;
  vertical-align: top;
  max-width: 18rem;
  overflow-wrap: anywhere;
}
.migrate-table th {
  background: var(--ledger-head);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 600;
  position: sticky;
  top: 0;
}
.migrate-table tr:last-child td {
  border-bottom: 0;
}
.migrate-bar {
  height: 0.35rem;
  background: var(--quiet-fill);
  border-radius: var(--radius-xs);
  overflow: hidden;
}
.migrate-bar span {
  display: block;
  height: 100%;
  background: var(--clay);
  transition: width 0.2s ease;
}
.migrate-log {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.82rem;
  max-height: 16rem;
  overflow-y: auto;
}
.migrate-log li {
  padding: 0.3rem 0.5rem;
  border-radius: var(--radius-xs);
  background: var(--quiet-fill);
}
.migrate-log li.ok {
  background: var(--ok-mist);
}
.migrate-log li.bad {
  background: rgba(194, 42, 72, 0.12);
}
.migrate-log li.mute {
  color: var(--quiet);
}
`;

export default function MigratePage() {
  return (
    <>
      <Head>
        <title>CSV 遷移工具 · 鋒兄 AI</title>
        <meta
          name="description"
          content="把 Appwrite 匯出的 CSV 對照欄位後遷移進 Sanity，送出前先看清楚哪些欄位對上、哪些會被丟掉。"
        />
        <meta name="color-scheme" content="dark light" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="stylesheet" href="/styles.css" />
        <script dangerouslySetInnerHTML={{ __html: shellBootScript }} />
        <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      </Head>
      <SanityMigrate />
    </>
  );
}
