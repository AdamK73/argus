export const palette = {
  fg: "#E5E5E5",
  dim: "#6B6B6B",
  accent: "#D97757",
  success: "#7BB382",
  error: "#D87470",
  warn: "#D9A05B",
  border: "#2E2E2E",
} as const;

export const glyphs = {
  box: {
    tl: "┌",
    tr: "┐",
    bl: "└",
    br: "┘",
    h: "─",
    v: "│",
    lt: "├",
    rt: "┤",
    tt: "┬",
    bt: "┴",
    cross: "┼",
  },
  bullets: {
    pointer: "▸",
    diamond: "◇",
    dot: "•",
    dash: "─",
  },
  status: {
    ok: "✓",
    fail: "✗",
  },
  spinnerBraille: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
} as const;

export const motion = {
  splashRevealMs: 400,
  hoverEaseMs: 60,
  modeEnterMs: 120,
  spinnerFrameMs: 80,
  flashMs: 200,
  statusTickMs: 1000,
} as const;


export type Palette = typeof palette;
export type Glyphs = typeof glyphs;
