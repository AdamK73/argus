import React from "react";
import { Box, Text } from "ink";
import { palette } from "./theme.js";

export interface Column<T> {
  header: string;
  width?: number;
  render: (row: T) => string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
}

export function Table<T>({ columns, rows, empty }: TableProps<T>): React.ReactElement {
  if (rows.length === 0) {
    return <Text color={palette.dim}>{empty ?? "—"}</Text>;
  }
  return (
    <Box flexDirection="column">
      <Box>
        {columns.map((c, i) => (
          <Box key={i} width={c.width} marginRight={i === columns.length - 1 ? 0 : 1}>
            <Text color={palette.dim}>{c.header.toUpperCase()}</Text>
          </Box>
        ))}
      </Box>
      {rows.map((row, ri) => (
        <Box key={ri}>
          {columns.map((c, ci) => (
            <Box key={ci} width={c.width} marginRight={ci === columns.length - 1 ? 0 : 1}>
              <Text color={palette.fg} wrap="truncate-end">
                {c.render(row)}
              </Text>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
