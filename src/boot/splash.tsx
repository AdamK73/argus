import React, { useEffect, useState } from "react";
import { Box } from "ink";
import { Logo } from "../ui/logo.js";

export interface SplashProps {
  onDone: () => void;
}

const FRAMES = 6;
const TOTAL_MS = 700;
const HOLD_MS = 250;

export function Splash({ onDone }: SplashProps): React.ReactElement {
  const [frame, setFrame] = useState(1); // start with one char visible so the user sees something immediately
  useEffect(() => {
    const tick = TOTAL_MS / FRAMES;
    const id = setInterval(() => {
      setFrame((f) => {
        const next = f + 1;
        if (next >= FRAMES) {
          clearInterval(id);
          setTimeout(onDone, HOLD_MS);
          return FRAMES;
        }
        return next;
      });
    }, tick);
    return () => clearInterval(id);
  }, [onDone]);
  return (
    <Box paddingX={2} paddingY={1}>
      <Logo reveal={Math.min(1, frame / FRAMES)} subtitle={frame >= FRAMES} />
    </Box>
  );
}
