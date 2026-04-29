import React from "react";
import { render } from "ink";
import { App } from "./app.js";
import { resolveEndpoint } from "./boot/endpoint-resolver.js";
import { runBlitzNonInteractive } from "./blitz-noninteractive.js";
import { shutdown } from "./session/store.js";
import { enterAltScreen, leaveAltScreen } from "./util/terminal.js";

const VERSION = "0.1.0";

const HELP = `argus ${VERSION} — Magento 2 frontend GraphQL debug CLI

usage:
  argus                                    interactive TUI
  argus --endpoint <url>                   override endpoint
  argus blitz <email> <store-code>         non-interactive blitzkrieg
  argus --version
  argus --help

env:
  ARGUS_ENDPOINT      graphql endpoint url
  ARGUS_ADMIN_KEY     admin bearer token (required for non-interactive)

config:
  ~/.argusrc.json     { "endpoint", "defaultStoreCode", "timeoutMs" }
`;

interface ParsedArgs {
  command: "tui" | "blitz" | "help" | "version";
  endpoint?: string;
  email?: string;
  store?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  let endpoint: string | undefined;
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--help" || a === "-h") return { command: "help" };
    if (a === "--version" || a === "-v") return { command: "version" };
    if (a === "--endpoint") {
      endpoint = args[i + 1];
      i++;
      continue;
    }
    if (a.startsWith("--endpoint=")) {
      endpoint = a.slice("--endpoint=".length);
      continue;
    }
    positional.push(a);
  }
  if (positional[0] === "blitz") {
    return {
      command: "blitz",
      ...(endpoint ? { endpoint } : {}),
      ...(positional[1] !== undefined ? { email: positional[1] } : {}),
      ...(positional[2] !== undefined ? { store: positional[2] } : {}),
    };
  }
  return { command: "tui", ...(endpoint ? { endpoint } : {}) };
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  if (parsed.command === "help") {
    process.stdout.write(HELP);
    return;
  }
  if (parsed.command === "version") {
    process.stdout.write(`${VERSION}\n`);
    return;
  }

  if (parsed.command === "blitz") {
    if (!parsed.email || !parsed.store) {
      process.stderr.write("argus blitz: usage: argus blitz <email> <store-code>\n");
      process.exit(1);
    }
    const resolved = resolveEndpoint(parsed.endpoint ? { flag: parsed.endpoint } : {});
    if (!resolved.url) {
      process.stderr.write("argus blitz: endpoint not configured (use --endpoint, ARGUS_ENDPOINT, or ~/.argusrc.json)\n");
      process.exit(1);
    }
    const exitCode = await runBlitzNonInteractive({
      email: parsed.email!,
      store: parsed.store!,
      endpoint: resolved.url,
    });
    process.exit(exitCode);
  }

  const resolved = resolveEndpoint(parsed.endpoint ? { flag: parsed.endpoint } : {});
  const defaultStoreCode = resolved.config.defaultStoreCode ?? "default";
  enterAltScreen();
  const ink = render(
    <App initialEndpoint={resolved.url} defaultStoreCode={defaultStoreCode} />,
    { exitOnCtrlC: true }
  );
  await ink.waitUntilExit();
  leaveAltScreen();
}

const cleanup = (): void => {
  leaveAltScreen();
  shutdown();
};
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});

main().catch((err) => {
  process.stderr.write(`argus: ${err instanceof Error ? err.message : String(err)}\n`);
  cleanup();
  process.exit(1);
});
