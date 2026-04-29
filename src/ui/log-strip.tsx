import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { palette } from "./theme.js";
import { getLog, subscribe, type LogEntry } from "../session/log.js";

export interface LogStripProps {
  title?: string;
  limit?: number;
}

export function LogStrip({ title = "log", limit = 8 }: LogStripProps): React.ReactElement {
  const [entries, setEntries] = useState<LogEntry[]>(() => getLog(limit));
  useEffect(() => subscribe(() => setEntries(getLog(limit))), [limit]);
  return (
    <Box flexDirection="column" paddingX={2} marginTop={1}>
      <Text color={palette.dim}>{title}</Text>
      {entries.length === 0 ? (
        <Text color={palette.dim}>(no requests yet)</Text>
      ) : (
        entries.map((e, i) => <LogRow key={`${e.ts}-${i}`} entry={e} />)
      )}
    </Box>
  );
}

function LogRow({ entry }: { entry: LogEntry }): React.ReactElement {
  const ok = entry.status >= 200 && entry.status < 300 && entry.errorCount === 0;
  const tone = ok ? palette.success : palette.error;
  const icon = ok ? "✓" : "✗";
  const stamp = formatTime(entry.ts);
  const status = entry.status === 0 ? "ERR" : String(entry.status);
  return (
    <Box>
      <Box width={2}>
        <Text color={tone}>{icon}</Text>
      </Box>
      <Box width={13}>
        <Text color={palette.dim}>{stamp}</Text>
      </Box>
      <Box width={32}>
        <Text color={palette.fg}>{entry.op}</Text>
      </Box>
      <Box width={6}>
        <Text color={palette.dim}>{status}</Text>
      </Box>
      <Box width={9}>
        <Text color={palette.dim}>{entry.ms}ms</Text>
      </Box>
      {entry.firstError ? (
        <Text color={palette.error} wrap="truncate-end">
          {entry.firstError}
        </Text>
      ) : null}
    </Box>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}
function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
