import type { Handlers } from "$fresh/server.ts";

type Row = Record<string, unknown>;

const moduleTypeAliases: Record<string, string[]> = {
  subscription: ["subscription", "fengbro_subscription"],
  food: ["food", "fengbro_food"],
  notes: ["notes", "fengbro_notes"],
  common: ["common", "fengbro_common"],
  images: ["images", "fengbro_images"],
  videos: ["videos", "fengbro_videos"],
  music: ["music", "fengbro_music"],
  documents: ["documents", "fengbro_documents"],
  podcast: ["podcast", "fengbro_podcast"],
  bank: ["bank", "fengbro_bank"],
  routine: ["routine", "fengbro_routine"],
};

function getWriteType(moduleId: string) {
  return moduleTypeAliases[moduleId]?.[0] || "";
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function getConfig(request: Request) {
  const headers = request.headers;
  const projectId = headers.get("x-sanity-project-id") || Deno.env.get("SANITY_PROJECT_ID") || "";
  const dataset = headers.get("x-sanity-dataset") || Deno.env.get("SANITY_DATASET") || "production";
  const token = headers.get("x-sanity-token") || Deno.env.get("SANITY_API_TOKEN") || "";
  const apiVersion = headers.get("x-sanity-api-version") || Deno.env.get("SANITY_API_VERSION") || "v2025-02-19";

  return { projectId, dataset, token, apiVersion };
}

function assertConfig(config: ReturnType<typeof getConfig>) {
  if (!config.projectId) return "缺少 SANITY_PROJECT_ID";
  if (!config.dataset) return "缺少 SANITY_DATASET";
  if (!config.token) return "缺少 SANITY_API_TOKEN";
  if (!/^v\d{4}-\d{2}-\d{2}$/.test(config.apiVersion)) return "SANITY_API_VERSION 格式應為 vYYYY-MM-DD";
  return "";
}

function cleanRow(row: Row) {
  const cleaned: Row = {};
  for (const [key, value] of Object.entries(row || {})) {
    if (key === "id" || key.startsWith("_")) continue;
    // 转换空字符串为 null
    cleaned[key] = value === "" ? null : value;
  }
  return cleaned;
}

async function sanityFetch(config: ReturnType<typeof getConfig>, path: string, init?: RequestInit) {
  const url = `https://${config.projectId}.api.sanity.io/${config.apiVersion}/data/${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
      ...(init?.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.description || body?.message || body?.error || "Sanity API request failed";
    throw new Error(String(message));
  }
  return body;
}

async function mutate(config: ReturnType<typeof getConfig>, mutations: Row[]) {
  return await sanityFetch(config, `mutate/${encodeURIComponent(config.dataset)}?returnDocuments=true`, {
    method: "POST",
    body: JSON.stringify({ mutations }),
  });
}

function parseCSV(csvText: string): Row[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: Row[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let currentValue = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    if (values.length === headers.length) {
      const row: Row = {};
      headers.forEach((header, index) => {
        const value = values[index];
        // 转换布尔值
        if (value === "true") row[header] = true;
        else if (value === "false") row[header] = false;
        // 转换数字
        else if (value && !isNaN(Number(value)) && value !== "") row[header] = Number(value);
        else row[header] = value || null;
      });
      rows.push(row);
    }
  }

  return rows;
}

export const handler: Handlers = {
  async POST(request) {
    const config = getConfig(request);
    const configError = assertConfig(config);
    if (configError) return json({ error: configError }, 400);

    try {
      const body = await request.json();
      const { module, data, format = "json" } = body;

      if (!module || !getWriteType(module)) {
        return json({ error: "未知的鋒兄模組" }, 400);
      }

      const type = getWriteType(module);
      let rows: Row[] = [];

      // 解析数据
      if (format === "csv" && typeof data === "string") {
        rows = parseCSV(data);
      } else if (format === "json" && Array.isArray(data)) {
        rows = data;
      } else {
        return json({ error: "不支持的數據格式" }, 400);
      }

      if (rows.length === 0) {
        return json({ error: "沒有可導入的資料" }, 400);
      }

      // 批量创建文档
      const mutations = rows.map((row: Row) => ({
        create: {
          _type: type,
          ...cleanRow(row),
        },
      }));

      const result = await mutate(config, mutations);
      
      return json({
        success: true,
        imported: rows.length,
        documents: result.results || [],
      });
    } catch (error) {
      return json({ 
        error: error instanceof Error ? error.message : "數據遷移失敗" 
      }, 500);
    }
  },
};
