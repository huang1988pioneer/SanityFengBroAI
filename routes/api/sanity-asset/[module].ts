import type { Handlers } from "$fresh/server.ts";

const imageModules = new Set(["images"]);
const fileModules = new Set(["videos", "music", "documents", "podcast"]);

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

export const handler: Handlers = {
  async POST(request, context) {
    const moduleId = context.params.module;
    const assetKind = imageModules.has(moduleId) ? "images" : fileModules.has(moduleId) ? "files" : "";
    if (!assetKind) return json({ error: "此模組不支援檔案上傳" }, 404);

    const config = getConfig(request);
    const configError = assertConfig(config);
    if (configError) return json({ error: configError }, 400);

    try {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return json({ error: "缺少上傳檔案" }, 400);

      const filename = encodeURIComponent(file.name || "upload");
      const url = `https://${config.projectId}.api.sanity.io/${config.apiVersion}/assets/${assetKind}/${encodeURIComponent(config.dataset)}?filename=${filename}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = body?.error?.description || body?.message || body?.error || "Sanity asset upload failed";
        throw new Error(String(message));
      }

      return json({
        asset: body.document || body,
        url: body.document?.url || body.url || "",
      });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Sanity 上傳失敗" }, 500);
    }
  },
};
