import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  chunkRows,
  migrateModuleIds,
  migrateModuleLabels,
  planMigration,
  type MigrateRow,
} from "../lib/migrate.ts";

type SanitySettings = {
  projectId: string;
  dataset: string;
  token: string;
  apiVersion: string;
};

/** 跟工作台共用同一把鑰匙，設定過就不必再填一次。 */
const settingsKey = "fengbro.sanity.settings.v1";

const defaultSettings: SanitySettings = {
  projectId: "",
  dataset: "production",
  token: "",
  apiVersion: "v2025-02-19",
};

const settingFields: Array<{ key: keyof SanitySettings; label: string; secret?: boolean }> = [
  { key: "projectId", label: "SANITY_PROJECT_ID" },
  { key: "dataset", label: "SANITY_DATASET" },
  { key: "token", label: "SANITY_API_TOKEN", secret: true },
  { key: "apiVersion", label: "SANITY_API_VERSION" },
];

const csvPlaceholder = "name,deposit,site\n兆豐銀行,1000,";

function readStoredSettings(): SanitySettings {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(settingsKey) || "{}") };
  } catch {
    return defaultSettings;
  }
}

function authHeaders(settings: SanitySettings) {
  return {
    "Content-Type": "application/json",
    "x-sanity-project-id": settings.projectId,
    "x-sanity-dataset": settings.dataset,
    "x-sanity-token": settings.token,
    "x-sanity-api-version": settings.apiVersion,
  };
}

function cellText(value: MigrateRow[string]) {
  if (typeof value === "boolean") return value ? "是" : "否";
  return String(value ?? "");
}

export default function SanityMigrate() {
  const [settings, setSettings] = useState<SanitySettings>(defaultSettings);
  const [showToken, setShowToken] = useState(false);
  const [moduleId, setModuleId] = useState("subscription");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [log, setLog] = useState<Array<{ tone: "ok" | "bad" | "mute"; text: string }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(readStoredSettings());
  }, []);

  const plan = useMemo(() => planMigration(csvText, moduleId), [csvText, moduleId]);
  const previewRows = plan.rows.slice(0, 8);
  const previewFields = plan.mappedHeaders.map((item) => item.field);
  const canRun = plan.rows.length > 0 && plan.errors.length === 0 && !running;

  const note = (tone: "ok" | "bad" | "mute", text: string) => {
    setLog((entries) => [...entries, { tone, text }]);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
      note("ok", "連線設定已存在這台瀏覽器");
    } catch {
      note("bad", "這個瀏覽器不讓寫入 localStorage，設定只在這一頁有效");
    }
  };

  const pickFile = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setCsvText(await file.text());
    setFileName(file.name);
    input.value = "";
  };

  const runMigration = async () => {
    if (!settings.projectId || !settings.token) {
      note("bad", "缺少 SANITY_PROJECT_ID 或 SANITY_API_TOKEN，先填好上面的連線設定");
      return;
    }

    const batches = chunkRows(plan.rows, 50);
    setRunning(true);
    setProgress({ done: 0, total: plan.rows.length });
    setLog([{ tone: "mute", text: `開始遷移 ${plan.rows.length} 筆到「${migrateModuleLabels[moduleId]}」` }]);

    let written = 0;
    for (let index = 0; index < batches.length; index++) {
      const batch = batches[index];
      try {
        const response = await fetch(`/api/sanity/${moduleId}`, {
          method: "POST",
          headers: authHeaders(settings),
          body: JSON.stringify({ rows: batch }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
        written += batch.length;
        setProgress({ done: written, total: plan.rows.length });
        note("ok", `第 ${index + 1} / ${batches.length} 批：寫入 ${batch.length} 筆`);
      } catch (error) {
        // 停在失敗的那一批：已寫入的不會回滾，硬送下去只會讓狀態更難對帳。
        note("bad", `第 ${index + 1} / ${batches.length} 批失敗：${error instanceof Error ? error.message : "未知錯誤"}`);
        note("mute", `已寫入 ${written} 筆，剩下 ${plan.rows.length - written} 筆沒有送出`);
        setRunning(false);
        return;
      }
    }

    note("ok", `遷移完成：${written} 筆已進入 Sanity`);
    setRunning(false);
  };

  return (
    <div class="migrate-page">
      <header class="migrate-head">
        <div>
          <p class="migrate-crumb">鋒兄工作台</p>
          <h1>CSV 遷移工具</h1>
          <p class="migrate-lede">
            把 Appwrite 匯出的 CSV 送進 Sanity。系統欄位（<code>$id</code>、<code>$createdAt</code>…）會自動丟掉，
            認不得的表頭會先列出來讓你確認，不會偷偷寫進文件。
          </p>
        </div>
        <a class="ghost-button" href="/">回工作台</a>
      </header>

      <section class="migrate-card">
        <div class="migrate-card-head">
          <h2>1 · 連線</h2>
          <p>鑰匙只存在這台瀏覽器；留白就改用伺服器的環境變數。</p>
        </div>
        <div class="migrate-grid">
          {settingFields.map((field) => (
            <label class="field" key={field.key}>
              <span>{field.label}</span>
              <input
                type={field.secret && !showToken ? "password" : "text"}
                value={settings[field.key]}
                autocomplete="off"
                onInput={(event) => setSettings({ ...settings, [field.key]: event.currentTarget.value })}
              />
            </label>
          ))}
        </div>
        <div class="migrate-actions">
          <button type="button" class="primary-button" onClick={saveSettings}>儲存連線設定</button>
          <button type="button" class="ghost-button" onClick={() => setShowToken((prev) => !prev)}>
            {showToken ? "隱藏令牌" : "顯示令牌"}
          </button>
        </div>
      </section>

      <section class="migrate-card">
        <div class="migrate-card-head">
          <h2>2 · 來源</h2>
          <p>選要寫進哪個模組，再貼上 CSV 或選一個檔案。</p>
        </div>
        <div class="migrate-grid">
          <label class="field">
            <span>目標模組</span>
            <select value={moduleId} onChange={(event) => setModuleId(event.currentTarget.value)}>
              {migrateModuleIds.map((id) => (
                <option value={id} key={id}>{migrateModuleLabels[id] || id}</option>
              ))}
            </select>
          </label>
          <label class="field">
            <span>CSV 檔案</span>
            <div class="migrate-file">
              <button type="button" class="ghost-button" onClick={() => fileRef.current?.click()}>選擇檔案</button>
              <span class="migrate-filename">{fileName || "尚未選擇"}</span>
              <input ref={fileRef} type="file" accept=".csv,text/csv" class="visually-hidden" onChange={pickFile} />
            </div>
          </label>
        </div>
        <label class="field wide">
          <span>CSV 內容</span>
          <textarea
            class="migrate-csv"
            rows={10}
            spellcheck={false}
            value={csvText}
            placeholder={csvPlaceholder}
            onInput={(event) => setCsvText(event.currentTarget.value)}
          />
        </label>
      </section>

      <section class="migrate-card">
        <div class="migrate-card-head">
          <h2>3 · 對照與預覽</h2>
          <p>送出前先看清楚哪些欄位對上了、哪些會被丟掉。</p>
        </div>

        {csvText.trim() === ""
          ? <p class="migrate-hint">貼上 CSV 之後這裡會出現欄位對照。</p>
          : (
            <>
              {plan.errors.map((error) => <p class="migrate-alert bad" key={error}>{error}</p>)}

              {plan.mappedHeaders.length > 0 && (
                <div class="migrate-chips">
                  <strong>對上 {plan.mappedHeaders.length} 欄</strong>
                  {plan.mappedHeaders.map((item) => (
                    <span class="migrate-chip ok" key={item.header}>
                      {item.header}
                      {item.header !== item.field && <em>→ {item.field}</em>}
                    </span>
                  ))}
                </div>
              )}

              {plan.ignoredHeaders.length > 0 && (
                <div class="migrate-chips">
                  <strong>丟棄 {plan.ignoredHeaders.length} 欄</strong>
                  {plan.ignoredHeaders.map((header) => (
                    <span class="migrate-chip bad" key={header}>{header}</span>
                  ))}
                </div>
              )}

              {plan.missingFields.length > 0 && (
                <div class="migrate-chips">
                  <strong>CSV 沒帶 {plan.missingFields.length} 欄</strong>
                  {plan.missingFields.map((field) => (
                    <span class="migrate-chip mute" key={field}>{field}</span>
                  ))}
                </div>
              )}

              {plan.skippedRows > 0 && (
                <p class="migrate-alert warn">有 {plan.skippedRows} 列在對照後整列空白，會被跳過。</p>
              )}

              {previewRows.length > 0 && (
                <>
                  <p class="migrate-hint">
                    共 {plan.rows.length} 筆，以下是前 {previewRows.length} 筆的樣子。
                  </p>
                  <div class="migrate-scroll">
                    <table class="migrate-table">
                      <thead>
                        <tr>{previewFields.map((field) => <th key={field}>{field}</th>)}</tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, index) => (
                          <tr key={index}>
                            {previewFields.map((field) => <td key={field}>{cellText(row[field])}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
      </section>

      <section class="migrate-card">
        <div class="migrate-card-head">
          <h2>4 · 遷移</h2>
          <p>每批 50 筆送出。寫入不會回滾，失敗就停在那一批。</p>
        </div>
        <div class="migrate-actions">
          <button type="button" class="primary-button" disabled={!canRun} onClick={() => void runMigration()}>
            {running ? `遷移中 ${progress.done} / ${progress.total}` : `開始遷移 ${plan.rows.length} 筆`}
          </button>
          {log.length > 0 && !running && (
            <button type="button" class="ghost-button" onClick={() => setLog([])}>清空紀錄</button>
          )}
        </div>
        {progress.total > 0 && (
          <div
            class="migrate-bar"
            role="progressbar"
            aria-valuenow={progress.done}
            aria-valuemin={0}
            aria-valuemax={progress.total}
          >
            <span style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
          </div>
        )}
        {log.length > 0 && (
          <ul class="migrate-log">
            {log.map((entry, index) => <li class={entry.tone} key={index}>{entry.text}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
