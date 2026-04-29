import React, { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import Spinner from "ink-spinner";
import { palette } from "../ui/theme.js";
import { setAdminKey, setEndpoint, getSession } from "../session/store.js";
import { call } from "../graphql/client.js";
import { PING_QUERY, type PingResult } from "../graphql/operations/ping.js";
import { isValidUrl } from "./endpoint-resolver.js";

export interface AdminKeyPromptProps {
  initialEndpoint: string | null;
  onReady: () => void;
}

type Stage =
  | { kind: "endpoint"; value: string; error?: string }
  | { kind: "key"; value: string; attempt: number; error?: string }
  | { kind: "validating"; key: string; attempt: number }
  | { kind: "failed"; attempt: number; error: string }
  | { kind: "fatal"; error: string };

const MAX_ATTEMPTS = 3;

export function AdminKeyPrompt({ initialEndpoint, onReady }: AdminKeyPromptProps): React.ReactElement {
  const app = useApp();
  const [stage, setStage] = useState<Stage>(
    initialEndpoint
      ? (() => {
          setEndpoint(initialEndpoint);
          return { kind: "key", value: "", attempt: 1 };
        })()
      : { kind: "endpoint", value: "" }
  );

  useInput((input, key) => {
    if (stage.kind === "endpoint") {
      if (key.return) {
        if (!isValidUrl(stage.value)) {
          setStage({ ...stage, error: "invalid url" });
          return;
        }
        setEndpoint(stage.value);
        setStage({ kind: "key", value: "", attempt: 1 });
        return;
      }
      if (key.backspace || key.delete) {
        setStage({ kind: "endpoint", value: stage.value.slice(0, -1) });
        return;
      }
      if (key.ctrl && input === "c") {
        app.exit();
        return;
      }
      if (input && !key.meta && !key.ctrl) {
        setStage({ kind: "endpoint", value: stage.value + input });
      }
      return;
    }
    if (stage.kind === "key") {
      if (key.return) {
        if (stage.value.length === 0) {
          setStage({ ...stage, error: "key required" });
          return;
        }
        const attempt = stage.attempt;
        const k = stage.value;
        setStage({ kind: "validating", key: k, attempt });
        void validate(k, attempt, setStage, onReady, app.exit);
        return;
      }
      if (key.backspace || key.delete) {
        setStage({ ...stage, value: stage.value.slice(0, -1), error: undefined });
        return;
      }
      if (key.ctrl && input === "c") {
        app.exit();
        return;
      }
      if (input && !key.meta && !key.ctrl) {
        setStage({ ...stage, value: stage.value + input, error: undefined });
      }
      return;
    }
    if (stage.kind === "failed") {
      if (key.ctrl && input === "c") {
        app.exit();
        return;
      }
      setStage({ kind: "key", value: "", attempt: stage.attempt + 1 });
      return;
    }
    if (stage.kind === "fatal") {
      app.exit();
    }
  });

  if (stage.kind === "endpoint") {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text color={palette.dim}>graphql endpoint</Text>
        <Box marginTop={1}>
          <Text color={palette.accent}>› </Text>
          <Text color={palette.fg}>{stage.value}</Text>
          <Text color={palette.accent}>▌</Text>
        </Box>
        <Box marginTop={1}>
          {stage.error ? (
            <Text color={palette.error}>{stage.error}</Text>
          ) : (
            <Text color={palette.dim}>
              full url to your /graphql endpoint    e.g. https://yourshop.tld/graphql
            </Text>
          )}
        </Box>
      </Box>
    );
  }

  if (stage.kind === "key") {
    const masked = "•".repeat(stage.value.length);
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text color={palette.dim}>
          admin api key{stage.attempt > 1 ? `   attempt ${stage.attempt}/${MAX_ATTEMPTS}` : ""}
        </Text>
        <Box marginTop={1}>
          <Text color={palette.accent}>› </Text>
          <Text color={palette.fg}>{masked}</Text>
          <Text color={palette.accent}>▌</Text>
        </Box>
        <Box marginTop={1}>
          {stage.error ? (
            <Text color={palette.error}>{stage.error}</Text>
          ) : (
            <Text color={palette.dim}>endpoint  {getSession().endpointHost}</Text>
          )}
        </Box>
      </Box>
    );
  }

  if (stage.kind === "validating") {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Box>
          <Text color={palette.accent}>
            <Spinner type="dots" />
          </Text>
          <Text color={palette.fg}> validating</Text>
        </Box>
        <Text color={palette.dim}>endpoint  {getSession().endpointHost}</Text>
      </Box>
    );
  }

  if (stage.kind === "failed") {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text color={palette.error}>auth failed   {stage.error}</Text>
        <Text color={palette.dim}>
          attempt {stage.attempt}/{MAX_ATTEMPTS}    any key to retry    ctrl-c to quit
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={palette.error}>fatal   {stage.error}</Text>
      <Text color={palette.dim}>any key to exit</Text>
    </Box>
  );
}

async function validate(
  key: string,
  attempt: number,
  setStage: (s: Stage) => void,
  onReady: () => void,
  exit: () => void
): Promise<void> {
  setAdminKey(key);
  const res = await call<PingResult>({
    query: PING_QUERY,
    authMode: "admin",
  });
  if (res.status === 200 && res.data?.storeConfig) {
    onReady();
    return;
  }
  const reason = describePingFailure(res);
  if (attempt >= MAX_ATTEMPTS) {
    setStage({ kind: "fatal", error: `${reason} — attempts exhausted` });
    setTimeout(() => exit(), 1200);
    return;
  }
  setStage({ kind: "failed", attempt, error: reason });
}

function describePingFailure(res: { status: number; errors?: { message: string }[] }): string {
  if (res.status === 0) {
    return res.errors?.[0]?.message ?? "network error";
  }
  if (res.status === 401 || res.status === 403) {
    return `unauthorized (${res.status})`;
  }
  const first = res.errors?.[0]?.message;
  if (first) return first;
  return `request failed (status ${res.status})`;
}
