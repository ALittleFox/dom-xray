/// <reference types="nuxt" />

export default defineEventHandler(async (event: any) => {
  try {
    const body = await readBody(event);
    return { ok: true, data: body };
  } catch {
    throw createError({ statusCode: 400, statusMessage: "Invalid JSON body" });
  }
});
