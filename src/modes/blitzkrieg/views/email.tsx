import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { palette } from "../../../ui/theme.js";
import { isValidEmail } from "../machine.js";

export interface EmailViewProps {
  initial: string;
  onSubmit: (email: string) => void;
  onCancel: () => void;
}

export function EmailView({ initial, onSubmit, onCancel }: EmailViewProps): React.ReactElement {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return) {
      const trimmed = value.trim();
      if (!isValidEmail(trimmed)) {
        setError("invalid address");
        return;
      }
      onSubmit(trimmed);
      return;
    }
    if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1));
      setError(null);
      return;
    }
    if (key.ctrl || key.meta) return;
    if (input) {
      setValue((v) => v + input);
      setError(null);
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={palette.dim}>blitzkrieg   step 1 of 2   customer email</Text>
      <Box marginTop={1}>
        <Text color={palette.accent}>› </Text>
        <Text color={palette.fg}>{value}</Text>
        <Text color={palette.accent}>▌</Text>
      </Box>
      <Box marginTop={1}>
        {error ? (
          <Text color={palette.error}>{error}</Text>
        ) : (
          <Text color={palette.dim}>↵ continue    esc cancel</Text>
        )}
      </Box>
    </Box>
  );
}
