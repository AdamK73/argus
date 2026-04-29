import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { palette } from "../../../ui/theme.js";
import type { BlitzState } from "../machine.js";
import { LogStrip } from "../../../ui/log-strip.js";

export interface SnapshotViewProps {
  state: BlitzState;
}

export function SnapshotView({ state }: SnapshotViewProps): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={palette.dim}>gathering snapshot</Text>
      <Box marginTop={1} flexDirection="column">
        <Row label="customer + addresses" status={state.customer.status} message={messageOf(state.customer)} />
        <Row label="cart summary" status={state.cartSummary.status} message={messageOf(state.cartSummary)} />
        <Row label="cart detail" status={state.cartDetail.status} message={messageOf(state.cartDetail)} />
      </Box>
      <LogStrip />
    </Box>
  );
}

function Row({
  label,
  status,
  message,
}: {
  label: string;
  status: "loading" | "ok" | "error";
  message: string | null;
}): React.ReactElement {
  return (
    <Box>
      <Box width={3}>
        {status === "loading" ? (
          <Text color={palette.accent}>
            <Spinner type="dots" />
          </Text>
        ) : status === "ok" ? (
          <Text color={palette.success}>✓</Text>
        ) : (
          <Text color={palette.error}>✗</Text>
        )}
      </Box>
      <Box width={28}>
        <Text color={palette.fg}>{label}</Text>
      </Box>
      {message ? <Text color={status === "error" ? palette.error : palette.dim}>{message}</Text> : null}
    </Box>
  );
}

function messageOf(s: { status: "loading" | "ok" | "error"; message?: string }): string | null {
  if (s.status === "error") return s.message ?? "error";
  return null;
}
