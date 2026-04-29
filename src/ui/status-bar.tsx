import React, { useEffect, useState } from "react";
import { Box, Text, useStdout } from "ink";
import { palette, motion } from "./theme.js";
import { getSession, sessionElapsedSeconds } from "../session/store.js";
import { formatElapsed } from "../util/clock.js";

const VERSION = "0.1.0";

export function StatusBar(): React.ReactElement {
  const [, force] = useState(0);
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), motion.statusTickMs);
    return () => clearInterval(t);
  }, []);
  const session = getSession();
  const adminMask = session.adminKey ? "●●●●" : "—";
  const store = session.storeCode ?? "—";
  const elapsed = formatElapsed(sessionElapsedSeconds());
  const host = truncate(session.endpointHost || "—", Math.max(8, Math.floor(cols * 0.25)));
  const segments = [
    `argus ${VERSION}`,
    host,
    `admin ${adminMask}`,
    `store ${store}`,
    elapsed,
  ];
  return (
    <Box paddingX={2}>
      <Text color={palette.dim}>{segments.join("   ")}</Text>
    </Box>
  );
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  if (max <= 1) return "…";
  return s.slice(0, max - 1) + "…";
}
