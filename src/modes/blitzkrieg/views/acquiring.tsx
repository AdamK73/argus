import React from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { palette } from "../../../ui/theme.js";

export interface AcquiringViewProps {
  email: string;
  store: string;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}

export function AcquiringView({ email, store, error, onRetry, onBack }: AcquiringViewProps): React.ReactElement {
  useInput((input) => {
    if (!error) return;
    if (input === "r") onRetry();
    else if (input === "b") onBack();
  });

  if (error) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text color={palette.error}>token acquisition failed</Text>
        <Box marginTop={1}>
          <Text color={palette.fg}>{error}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={palette.dim}>email {email}    store {store}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={palette.dim}>r retry    b back</Text>
        </Box>
      </Box>
    );
  }
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box>
        <Text color={palette.accent}>
          <Spinner type="dots" />
        </Text>
        <Text color={palette.fg}> acquiring token</Text>
      </Box>
      <Text color={palette.dim}>email {email}    store {store}</Text>
    </Box>
  );
}
