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
  tools: ["tools", "fengbro_tools"],
  about: ["about", "fengbro_about"],
};

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

function getTypeAliases(moduleId: string) {
  return moduleTypeAliases[moduleId] || [];
}

function getWriteType(moduleId: string) {
  return getTypeAliases(moduleId)[0] || "";
}

function buildTypeFilter(types: string[]) {
  return types.map((type) => `_type == "${type}"`).join(" || ");
}

function cleanRow(row: Row) {
  const cleaned: Row = {};
  for (const [key, value] of Object.entries(row || {})) {
    if (key === "id" || key.startsWith("_")) continue;
    cleaned[key] = value;
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
    const desc = body?.error?.description || body?.message || body?.error || "";
    const raw = JSON.stringify(body);
    const message = `[HTTP ${response.status}] ${desc || raw || "Sanity API request failed"}`;
    throw new Error(message);
  }
  return body;
}

async function mutate(config: ReturnType<typeof getConfig>, mutations: Row[]) {
  return await sanityFetch(config, `mutate/${encodeURIComponent(config.dataset)}?returnDocuments=true`, {
    method: "POST",
    body: JSON.stringify({ mutations }),
  });
}

export const handler: Handlers = {
  async GET(request, context) {
    const moduleId = context.params.module;
    const typeAliases = getTypeAliases(moduleId);
    const writeType = getWriteType(moduleId);
    if (!writeType) return json({ error: "未知的鋒兄模組" }, 404);

    const config = getConfig(request);
    const configError = assertConfig(config);
    if (configError) {
      return json({
        rows: [],
        type: writeType,
        typeAliases,
        error: configError,
        configMissing: true,
      });
    }

    try {
      const query = encodeURIComponent(`*[${buildTypeFilter(typeAliases)}] | order(_updatedAt desc)`);
      const data = await sanityFetch(config, `query/${encodeURIComponent(config.dataset)}?query=${query}`);
      const rows = (data.result || []).map((doc: Row) => ({
        id: doc._id,
        ...doc,
      }));
      return json({ rows, type: writeType, typeAliases });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Sanity 讀取失敗" }, 500);
    }
  },

  async POST(request, context) {
    const moduleId = context.params.module;
    const writeType = getWriteType(moduleId);
    if (!writeType) return json({ error: "未知的鋒兄模組" }, 404);

    const config = getConfig(request);
    const configError = assertConfig(config);
    if (configError) return json({ error: configError }, 400);

    try {
      const body = await request.json();
      const rows = Array.isArray(body.rows) ? body.rows : [body.row];
      const mutations = rows.filter(Boolean).map((row: Row) => ({
        create: {
          _type: writeType,
          ...cleanRow(row),
        },
      }));
      if (mutations.length === 0) return json({ error: "沒有可寫入的資料" }, 400);
      const result = await mutate(config, mutations);
      return json({ result, type: writeType });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Sanity 寫入失敗" }, 500);
    }
  },

  async PUT(request, context) {
    const moduleId = context.params.module;
    const writeType = getWriteType(moduleId);
    if (!writeType) return json({ error: "未知的鋒兄模組" }, 404);

    const config = getConfig(request);
    const configError = assertConfig(config);
    if (configError) return json({ error: configError }, 400);

    try {
      const body = await request.json();
      if (!body.id) return json({ error: "缺少 Sanity document id" }, 400);
      const result = await mutate(config, [{
        patch: {
          id: body.id,
          set: cleanRow(body.row || {}),
        },
      }]);
      return json({ result });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Sanity 更新失敗" }, 500);
    }
  },

  async DELETE(request, context) {
    const moduleId = context.params.module;
    const writeType = getWriteType(moduleId);
    if (!writeType) return json({ error: "未知的鋒兄模組" }, 404);

    const config = getConfig(request);
    const configError = assertConfig(config);
    if (configError) return json({ error: configError }, 400);

    try {
      const body = await request.json();
      if (!body.id) return json({ error: "缺少 Sanity document id" }, 400);
      const result = await mutate(config, [{ delete: { id: body.id } }]);
      return json({ result });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Sanity 刪除失敗" }, 500);
    }
  },

  // PATCH: 診斷端點，測試 Sanity 連線與 token 權限
  async PATCH(request, context) {
    const moduleId = context.params.module;
    const typeAliases = getTypeAliases(moduleId);
    const writeType = getWriteType(moduleId);
    const config = getConfig(request);

    const info: Record<string, unknown> = {
      module: moduleId,
      type: writeType || "(未知模組)",
      typeAliases,
      projectId: config.projectId || "(空白)",
      dataset: config.dataset || "(空白)",
      hasToken: !!config.token,
      tokenPrefix: config.token ? config.token.slice(0, 8) + "..." : "(無)",
      apiVersion: config.apiVersion,
    };

    const configError = assertConfig(config);
    if (configError) return json({ ok: false, error: configError, info });
    if (!writeType) return json({ ok: false, error: "未知的鋒兄模組", info });

    try {
      // 讀取目前模組的所有相容 type，幫助判斷 Studio schema 與歷史資料是否分散。
      const query = encodeURIComponent(`*[${buildTypeFilter(typeAliases)}]{_type}[0...999]`);
      const readResult = await sanityFetch(config, `query/${encodeURIComponent(config.dataset)}?query=${query}`);
      info.readOk = true;
      info.readCount = readResult?.result?.length ?? 0;
      info.readByType = Object.values(
        (readResult?.result || []).reduce((acc: Record<string, { type: string; count: number }>, row: Row) => {
          const currentType = String(row._type || "(unknown)");
          acc[currentType] = {
            type: currentType,
            count: (acc[currentType]?.count || 0) + 1,
          };
          return acc;
        }, {}),
      );

      // 測試 mutation（用 createIfNotExists 寫一筆 ping 文件）
      const pingId = `${writeType}-ping-test`;
      const pingResult = await mutate(config, [{
        createIfNotExists: {
          _id: pingId,
          _type: writeType,
          _sanityPingTest: true,
          name: "__ping__",
        },
      }]);
      info.writeOk = true;
      info.pingResult = pingResult?.results?.[0]?.operation ?? pingResult;

      // 刪除 ping 文件（清理）
      await mutate(config, [{ delete: { id: pingId } }]);
      info.cleanupOk = true;

      return json({ ok: true, info });
    } catch (error) {
      info.error = error instanceof Error ? error.message : String(error);
      return json({ ok: false, info }, 500);
    }
  },
};
