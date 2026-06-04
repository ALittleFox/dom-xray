import { NextResponse } from "next/server";
import { collectSources } from "./source-collector.js";
import { resolveClientPath } from "@dom-selector/core";
import fs from "node:fs";

export async function handleSourcesGet() {
  const sources = collectSources();
  return NextResponse.json(sources);
}

export async function handleClientGet() {
  const clientPath = resolveClientPath();
  const source = fs.readFileSync(clientPath, "utf-8");
  return new NextResponse(source, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store",
    },
  });
}

export async function handleSubmitPost(request: Request) {
  try {
    const data = await request.json();

    const config = process.env.DOM_SELECTOR_CONFIG
      ? JSON.parse(process.env.DOM_SELECTOR_CONFIG)
      : {};

    if (typeof config.onSubmit === "function") {
      try {
        await config.onSubmit(data);
        return NextResponse.json({ ok: true });
      } catch (e: any) {
        return NextResponse.json(
          { ok: false, error: String(e) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
