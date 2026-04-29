import { spawn } from "node:child_process";

export type ClipboardResult =
  | { ok: true; tool: string }
  | { ok: false; reason: string };

interface Candidate {
  cmd: string;
  args: string[];
}

function candidates(): Candidate[] {
  const platform = process.platform;
  if (platform === "darwin") {
    return [{ cmd: "pbcopy", args: [] }];
  }
  if (platform === "win32") {
    return [{ cmd: "clip", args: [] }];
  }
  if (process.env.WAYLAND_DISPLAY) {
    return [
      { cmd: "wl-copy", args: [] },
      { cmd: "xclip", args: ["-selection", "clipboard"] },
      { cmd: "xsel", args: ["--clipboard", "--input"] },
    ];
  }
  return [
    { cmd: "xclip", args: ["-selection", "clipboard"] },
    { cmd: "xsel", args: ["--clipboard", "--input"] },
    { cmd: "wl-copy", args: [] },
  ];
}

export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  for (const c of candidates()) {
    const ok = await tryWrite(c, text);
    if (ok) return { ok: true, tool: c.cmd };
  }
  return { ok: false, reason: "no clipboard tool found" };
}

function tryWrite(c: Candidate, text: string): Promise<boolean> {
  return new Promise((resolve) => {
    let proc: ReturnType<typeof spawn>;
    try {
      proc = spawn(c.cmd, c.args, { stdio: ["pipe", "ignore", "ignore"] });
    } catch {
      resolve(false);
      return;
    }
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
    proc.stdin?.end(text);
  });
}
