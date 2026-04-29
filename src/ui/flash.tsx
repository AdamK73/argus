import React, { useEffect, useState } from "react";
import { Box } from "ink";
import { motion, palette } from "./theme.js";

export type FlashTone = "success" | "error" | "none";

export interface FlashProps {
  tone: FlashTone;
  onDone?: () => void;
  children: React.ReactNode;
}

export function Flash({ tone, onDone, children }: FlashProps): React.ReactElement {
  const [visible, setVisible] = useState(tone !== "none");
  useEffect(() => {
    if (tone === "none") {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, motion.flashMs);
    return () => clearTimeout(t);
  }, [tone, onDone]);

  const color = !visible
    ? palette.border
    : tone === "success"
      ? palette.success
      : tone === "error"
        ? palette.error
        : palette.border;

  return (
    <Box borderStyle="single" borderColor={color} paddingX={1}>
      {children}
    </Box>
  );
}
