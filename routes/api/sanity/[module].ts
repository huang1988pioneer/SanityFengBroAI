import type { Handlers } from "$fresh/server.ts";

type Row = Record<string, unknown>;

const moduleTypes: Record<string, string> = {
  subscription: "fengbro_subscription",
  food: "fengbro_food",
  notes: "fengbro_notes",
  common: "fengbro_common",
  images: "fengbro_images",
  videos: "fengbro_videos",
  music: "fengbro_music",
  documents: "fengbro_documents",
  podcast: "fengbro_podcast",
  bank: "fengbro_bank",
  routine: "fengbro_routine",
  tools: "fengbro_tools",
  about: "fengbro_about",
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

function getType(moduleId: string) {
  return moduleTypes[moduleId] || "";
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

export const handler: Handlers = {
  async GET(request, context) {
    const moduleId = context.params.module;
    const type = getType(moduleId);
    if (!type) return json({ error: "未知的鋒兄模組" }, 404);

    const config = getConfig(request);
    const configError = assertConfig(config);
    if (configError) return json({ rows: [], type, error: configError, configMissing: true });

    try {
      const query = encodeURIComponent(`*[_type == "${type}"] | order(_updatedAt desc)`);
      const data = await sanityFetch(config, `query/${encodeURIComponent(config.dataset)}?query=${query}`);
      const rows = (data.result || []).map((doc: Row) => ({
        id: doc._id,
        ...doc,
      }));
      return json({ rows, type });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Sanity 讀取失敗" }, 500);
    }
  },

  async POST(request, context) {
    const moduleId = context.params.module;
    const type = getType(moduleId);
    if (!type) return json({ error: "未知的鋒兄模組" }, 404);

    const config = getConfig(request);
    const configError = assertConfig(config);
    if (configError) return json({ error: configError }, 400);

    try {
      const body = await request.json();
      const rows = Array.isArray(body.rows) ? body.rows : [body.row];
      const mutations = rows.filter(Boolean).map((row: Row) => ({
        create: {
          _type: type,
          ...cleanRow(row),
        },
      }));
      if (mutations.length === 0) return json({ error: "沒有可寫入的資料" }, 400);
      const result = await mutate(config, mutations);
      return json({ result });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Sanity 寫入失敗" }, 500);
    }
  },

  async PUT(request, context) {
    const moduleId = context.params.module;
    const type = getType(moduleId);
    if (!type) return json({ error: "未知的鋒兄模組" }, 404);

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
    const type = getType(moduleId);
    if (!type) return json({ error: "未知的鋒兄模組" }, 404);

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
};
