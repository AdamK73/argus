import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { palette } from "../../../ui/theme.js";

export interface StoreViewProps {
  initial: string;
  onSubmit: (store: string) => void;
  onBack: () => void;
}

export function StoreView({ initial, onSubmit, onBack }: StoreViewProps): React.ReactElement {
  const [value, setValue] = useState(initial);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if (key.return) {
      const v = value.trim().length > 0 ? value.trim() : "default";
      onSubmit(v);
      return;
    }
    if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1));
      return;
    }
    if (key.ctrl || key.meta) return;
    if (input) setValue((v) => v + input);
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={palette.dim}>blitzkrieg   step 2 of 2   store code</Text>
      <Box marginTop={1}>
        <Text color={palette.accent}>› </Text>
        <Text color={palette.fg}>{value || ""}</Text>
        <Text color={palette.accent}>▌</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={palette.dim}>
          {value.length === 0 ? "empty resolves to “default”" : " "}
        </Text>
      </Box>
      <Text color={palette.dim}>↵ continue    esc back</Text>
    </Box>
  );
}
