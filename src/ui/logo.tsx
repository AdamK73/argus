import React from "react";
import { Box, Text } from "ink";
import { palette } from "./theme.js";

export interface LogoProps {
  reveal?: number;
  subtitle?: boolean;
}

export function Logo({ reveal = 1, subtitle = true }: LogoProps): React.ReactElement {
  const full = "argus";
  const r = Math.min(1, Math.max(0, reveal));
  const charsToShow = Math.max(1, Math.round(full.length * r));
  const text = full.slice(0, charsToShow);
  return (
    <Box flexDirection="column">
      <Text color={palette.accent}>{text}</Text>
      {subtitle ? (
        <Text color={palette.dim}>magento 2 graphql · the hundred-eyed watcher</Text>
      ) : null}
    </Box>
  );
}
