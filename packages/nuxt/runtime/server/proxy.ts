/// <reference types="nuxt" />

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const serverPort = config.domSelectorStandalonePort as number | undefined;

  if (!serverPort) {
    throw createError({
      statusCode: 500,
      statusMessage: "[dom-xray] Standalone server port not configured",
    });
  }

  const targetUrl = `http://localhost:${serverPort}${event.node.req.url}`;

  const method = event.node.req.method || "GET";
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(event.node.req.headers)) {
    if (typeof value === "string") {
      headers[key] = value;
    } else if (Array.isArray(value)) {
      headers[key] = value.join(", ");
    }
  }

  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await readRawBody(event);
  }

  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
  });

  event.node.res.statusCode = response.status;
  event.node.res.statusMessage = response.statusText;

  response.headers.forEach((value, key) => {
    // Skip hop-by-hop headers
    if (["transfer-encoding", "connection", "keep-alive"].includes(key.toLowerCase())) {
      return;
    }
    event.node.res.setHeader(key, value);
  });

  const data = await response.arrayBuffer();
  event.node.res.end(Buffer.from(data));
});
