import React, { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { palette } from "../ui/theme.js";

export type MenuKey =
  | "blitzkrieg"
  | "cart-forge"
  | "schema-diff"
  | "mutation-lab"
  | "cache-inspector"
  | "settings"
  | "quit";

interface Item {
  key: MenuKey;
  label: string;
  hint: string;
  enabled: boolean;
  group: "primary" | "system";
}

const ITEMS: Item[] = [
  { key: "blitzkrieg", label: "blitzkrieg", hint: "fast customer probe", enabled: true, group: "primary" },
  { key: "cart-forge", label: "cart forge", hint: "planned", enabled: false, group: "primary" },
  { key: "schema-diff", label: "schema diff", hint: "planned", enabled: false, group: "primary" },
  { key: "mutation-lab", label: "mutation lab", hint: "planned", enabled: false, group: "primary" },
  { key: "cache-inspector", label: "cache inspector", hint: "planned", enabled: false, group: "primary" },
  { key: "settings", label: "settings", hint: "", enabled: true, group: "system" },
  { key: "quit", label: "quit", hint: "", enabled: true, group: "system" },
];

export interface MenuProps {
  onSelect: (key: MenuKey) => void;
}

export function Menu({ onSelect }: MenuProps): React.ReactElement {
  const enabledIdxs = ITEMS.flatMap((it, i) => (it.enabled ? [i] : []));
  const [cursor, setCursor] = useState<number>(enabledIdxs[0] ?? 0);
  const app = useApp();

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setCursor((c) => prevEnabled(c));
      return;
    }
    if (key.downArrow || input === "j") {
      setCursor((c) => nextEnabled(c));
      return;
    }
    if (key.return) {
      const item = ITEMS[cursor];
      if (item && item.enabled) onSelect(item.key);
      return;
    }
    if (key.escape || input === "q") {
      app.exit();
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box flexDirection="column" marginBottom={1}>
        <Text color={palette.accent}>argus</Text>
        <Text color={palette.dim}>magento 2 graphql · the hundred-eyed watcher</Text>
      </Box>
      {ITEMS.map((item, i) => {
        const prev = ITEMS[i - 1];
        const showSeparator = prev && prev.group !== item.group;
        return (
          <React.Fragment key={item.key}>
            {showSeparator ? <Box height={1} /> : null}
            <MenuRow item={item} active={i === cursor} />
          </React.Fragment>
        );
      })}
      <Box marginTop={1}>
        <Text color={palette.dim}>↑↓ move    ↵ select    esc quit</Text>
      </Box>
    </Box>
  );
}

function MenuRow({ item, active }: { item: Item; active: boolean }): React.ReactElement {
  const labelColor = !item.enabled ? palette.dim : active ? palette.accent : palette.fg;
  return (
    <Box>
      <Box width={2}>
        <Text color={palette.accent}>{active ? "›" : " "}</Text>
      </Box>
      <Box width={20}>
        <Text color={labelColor}>{item.label}</Text>
      </Box>
      {item.hint ? <Text color={palette.dim}>{item.hint}</Text> : null}
    </Box>
  );
}

function prevEnabled(idx: number): number {
  for (let i = idx - 1; i >= 0; i--) {
    if (ITEMS[i]?.enabled) return i;
  }
  for (let i = ITEMS.length - 1; i > idx; i--) {
    if (ITEMS[i]?.enabled) return i;
  }
  return idx;
}

function nextEnabled(idx: number): number {
  for (let i = idx + 1; i < ITEMS.length; i++) {
    if (ITEMS[i]?.enabled) return i;
  }
  for (let i = 0; i < idx; i++) {
    if (ITEMS[i]?.enabled) return i;
  }
  return idx;
}
