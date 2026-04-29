import React from "react";
import { Box, Text } from "ink";
import { palette } from "./theme.js";

export interface PanelProps {
  title?: string;
  tone?: "default" | "error" | "warn" | "success";
  flexGrow?: number;
  width?: number | string;
  children?: React.ReactNode;
}

export function Panel({
  title,
  tone = "default",
  flexGrow,
  width,
  children,
}: PanelProps): React.ReactElement {
  const titleColor =
    tone === "error" ? palette.error : tone === "warn" ? palette.warn : tone === "success" ? palette.success : palette.dim;
  return (
    <Box flexDirection="column" flexGrow={flexGrow} width={width} paddingX={2} marginBottom={1}>
      {title ? (
        <Box marginBottom={1}>
          <Text color={titleColor}>{title}</Text>
        </Box>
      ) : null}
      {children}
    </Box>
  );
}
