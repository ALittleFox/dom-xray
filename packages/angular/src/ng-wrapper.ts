#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import { loadConfig } from "./config";
import type { PluginConfig } from "./config";
import { patchFsReadFile } from "./patch-fs";
import { startDevServer } from "./dev-server";

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

function color(str: string, c: keyof typeof COLORS): string {
  return `${COLORS[c]}${str}${COLORS.reset}`;
}

function findAngularJson(): string | null {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "angular.json");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function checkAngularConfig(): boolean {
  const angularJsonPath = findAngularJson();
  if (!angularJsonPath) {
    console.log(
      color("[dom-selector] ", "red") +
        "angular.json not found. Make sure you run this command from an Angular project root."
    );
    return false;
  }

  try {
    JSON.parse(fs.readFileSync(angularJsonPath, "utf-8"));
  } catch {
    console.log(
      color("[dom-selector] ", "red") + "Failed to parse angular.json."
    );
    return false;
  }

  console.log(
    color("[dom-selector] ", "green") + "Angular configuration looks good."
  );
  return true;
}

function findUserPort(extraArgs: string[]): number {
  for (let i = 0; i < extraArgs.length; i++) {
    if (
      (extraArgs[i] === "--port" || extraArgs[i] === "-p") &&
      extraArgs[i + 1]
    ) {
      return parseInt(extraArgs[i + 1], 10);
    }
  }
  return 4200;
}

function getFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
  });
}

function injectScriptIntoHtml(html: string, config: PluginConfig): string {
  const clientScript = '<script src="/__dom-selector/client.js"></script>';
  if (html.includes(clientScript)) return html;

  const configScript = `<script>window.__DOM_SELECTOR_CONFIG__ = ${JSON.stringify(
    {
      title: config.title,
      hotkey: config.hotkey,
      clickSelector: config.clickSelector,
      targetFilePatterns: config.targetFilePatterns,
      editor: config.editor || "vscode",
      agentConfig: config.agentConfig,
    }
  )}; window.__DOM_SELECTOR_API__ = "/__dom-selector";</script>`;

  const fullScript = configScript + clientScript;

  // Try to inject before closing body tag; fallback to closing html tag
  if (html.includes("</body>")) {
    return html.replace("</body>", `${fullScript}</body>`);
  }
  if (html.includes("</html>")) {
    return html.replace("</html>", `${fullScript}</html>`);
  }
  return html + fullScript;
}

function fetchHtmlFromAngular(port: number, url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${url}`, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(body));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function startProxy(
  userPort: number,
  angularPort: number,
  apiPort: number,
  config: PluginConfig
): void {
  const proxy = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    // API routes -> forward to API server
    if (req.url?.startsWith("/__dom-selector/")) {
      const proxyReq = http.request(
        {
          hostname: "localhost",
          port: apiPort,
          path: req.url,
          method: req.method,
          headers: req.headers,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
          proxyRes.pipe(res);
        }
      );
      req.pipe(proxyReq);
      proxyReq.on("error", () => {
        res.writeHead(502);
        res.end("API server unavailable");
      });
      return;
    }

    // Intercept index.html to inject client script
    if (req.url === "/" || req.url === "/index.html") {
      try {
        const html = await fetchHtmlFromAngular(angularPort, req.url);
        const injected = injectScriptIntoHtml(html, config);
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        res.end(injected);
      } catch {
        res.writeHead(502);
        res.end("Failed to fetch index.html from Angular dev server");
      }
      return;
    }

    // Forward everything else to Angular dev server
    const proxyReq = http.request(
      {
        hostname: "localhost",
        port: angularPort,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );
    req.pipe(proxyReq);
    proxyReq.on("error", () => {
      res.writeHead(502);
      res.end("Angular dev server unavailable");
    });
  });

  // Forward WebSocket upgrade for HMR
  proxy.on("upgrade", (req, socket, head) => {
    const proxySocket = net.connect(angularPort, "localhost", () => {
      proxySocket.write(
        `${req.method} ${req.url} HTTP/1.1\r\n` +
          Object.entries(req.headers)
            .map(([k, v]) => `${k}: ${v}\r\n`)
            .join("") +
          "\r\n"
      );
      proxySocket.write(head);
      socket.pipe(proxySocket).pipe(socket);
    });
    proxySocket.on("error", () => socket.end());
  });

  proxy.listen(userPort, () => {
    console.log(
      color("[dom-selector] ", "green") +
        `Dev proxy running on http://localhost:${userPort}`
    );
  });
}

function resolvePatchModule(): string {
  try {
    return require.resolve("@dom-selector/angular/patch");
  } catch {
    return path.resolve(__dirname, "patch-fs.js");
  }
}

function runNgCommand(
  command: string,
  extraArgs: string[],
  internalPort?: number
): void {
  const isWindows = process.platform === "win32";
  const ngBin = path.resolve(
    process.cwd(),
    "node_modules",
    ".bin",
    isWindows ? "ng.cmd" : "ng"
  );

  const args = [command, ...extraArgs];
  const cmd = fs.existsSync(ngBin) ? ngBin : "npx";
  if (cmd === "npx") {
    args.unshift("ng");
  }

  // Pass fs patch to child process via NODE_OPTIONS
  const patchPath = resolvePatchModule();
  const nodeOptions = process.env.NODE_OPTIONS || "";
  const nodeOptionsWithPatch = nodeOptions.includes(patchPath)
    ? nodeOptions
    : `${nodeOptions} -r "${patchPath}"`.trim();

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_OPTIONS: nodeOptionsWithPatch,
  };

  // Suppress Angular's "Local: http://localhost:xxxx" output when using proxy
  // because the real user-facing port is different
  if (internalPort) {
    env.FORCE_COLOR = process.env.FORCE_COLOR || "1";
  }

  const child = spawn(cmd, args, {
    stdio: "inherit",
    shell: isWindows,
    env,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || "serve";
  const extraArgs = args.slice(1);

  // Load dom-selector config
  const config = loadConfig(process.cwd());

  // 1. Patch fs.readFileSync for HTML template injection
  patchFsReadFile();

  // 2. Check Angular configuration (only check define, not index.html)
  const configOk = checkAngularConfig();
  if (!configOk && command === "serve") {
    console.log(
      color("[dom-selector] ", "yellow") +
        "Starting anyway... Fix the warnings above if the overlay does not work.\n"
    );
  }

  // 3. If serving, start API server and dev proxy
  if (command === "serve") {
    const userPort = findUserPort(extraArgs);
    const angularPort = await getFreePort();

    // Start API server with config
    startDevServer(8090, config);

    // Start proxy that intercepts index.html
    startProxy(userPort, angularPort, 8090, config);

    // Rewrite port argument so Angular listens on internal port
    const portIdx = extraArgs.findIndex(
      (a) => a === "--port" || a === "-p"
    );
    if (portIdx !== -1 && extraArgs[portIdx + 1]) {
      extraArgs[portIdx + 1] = String(angularPort);
    } else {
      extraArgs.push("--port", String(angularPort));
    }

    // Delegate to Angular CLI
    console.log(
      color("[dom-selector] ", "dim") +
        `Angular dev server on internal port ${angularPort}\n`
    );
    runNgCommand(command, extraArgs, angularPort);
    return;
  }

  // 4. For build, just delegate
  console.log(
    color("[dom-selector] ", "dim") +
      `Delegating to: ng ${command} ${extraArgs.join(" ")}\n`
  );
  runNgCommand(command, extraArgs);
}

main();
