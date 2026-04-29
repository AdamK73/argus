import React, { useCallback, useEffect, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { palette } from "../../ui/theme.js";
import { EmailView } from "./views/email.js";
import { StoreView } from "./views/store.js";
import { AcquiringView } from "./views/acquiring.js";
import { SnapshotView } from "./views/snapshot.js";
import { ResultsView } from "./views/results.js";
import { initialBlitzState, type BlitzState } from "./machine.js";
import { acquireCustomerToken, runSnapshot } from "./runner.js";
import { clearModeState, getSession } from "../../session/store.js";
import { writeSnapshot } from "../../util/json-dump.js";
import { copyToClipboard } from "../../util/clipboard.js";
import { LogStrip } from "../../ui/log-strip.js";

export interface BlitzkriegProps {
  defaultStore: string;
  onExit: () => void;
}

type Toast = { tone: "success" | "error"; message: string } | null;

export function Blitzkrieg({ defaultStore, onExit }: BlitzkriegProps): React.ReactElement {
  const app = useApp();
  const [state, setState] = useState<BlitzState>(() => initialBlitzState(defaultStore));
  const [toast, setToast] = useState<Toast>(null);
  const [showLog, setShowLog] = useState<boolean>(false);

  const goEmail = useCallback(() => {
    clearModeState();
    setState(initialBlitzState(defaultStore));
  }, [defaultStore]);

  const handleEmail = useCallback(
    (email: string) => {
      setState((s) => ({ ...s, email, step: "store" }));
    },
    []
  );

  const handleStore = useCallback((store: string) => {
    setState((s) => ({ ...s, store, step: "acquiring", acquireError: null }));
  }, []);

  const handleAcquire = useCallback(
    async (email: string, store: string) => {
      const outcome = await acquireCustomerToken(email, store);
      if (!outcome.ok) {
        setState((s) => ({ ...s, step: "acquiring", acquireError: outcome.reason }));
        return;
      }
      setState((s) => ({
        ...s,
        step: "snapshot",
        customer: { status: "loading" },
        cartSummary: { status: "loading" },
        cartDetail: { status: "loading" },
      }));
      const t0 = Date.now();
      const results = await runSnapshot(store);
      setState((s) => ({
        ...s,
        step: "results",
        customer: results.customer.ok
          ? { status: "ok", data: results.customer.data, fetchedAt: t0 }
          : { status: "error", message: results.customer.message, fetchedAt: t0 },
        cartSummary: results.cartSummary.ok
          ? { status: "ok", data: results.cartSummary.data, fetchedAt: t0 }
          : { status: "error", message: results.cartSummary.message, fetchedAt: t0 },
        cartDetail: results.cartDetail.ok
          ? { status: "ok", data: results.cartDetail.data, fetchedAt: t0 }
          : { status: "error", message: results.cartDetail.message, fetchedAt: t0 },
      }));
    },
    []
  );

  useEffect(() => {
    if (state.step === "acquiring" && !state.acquireError) {
      void handleAcquire(state.email, state.store);
    }
  }, [state.step, state.acquireError, state.email, state.store, handleAcquire]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1500);
    return () => clearTimeout(t);
  }, [toast]);

  useInput(
    (input, key) => {
      if (state.step !== "results") return;
      if (input === "q") {
        clearModeState();
        app.exit();
        return;
      }
      if (input === "b" || key.escape) {
        clearModeState();
        onExit();
        return;
      }
      if (input === "r") {
        setState((s) => ({ ...s, step: "acquiring", acquireError: null }));
        return;
      }
      if (input === "c") {
        const cartId =
          state.cartDetail.status === "ok" ? state.cartDetail.data?.id : state.cartSummary.status === "ok" ? state.cartSummary.data?.id : null;
        if (!cartId) {
          setToast({ tone: "error", message: "no cart id" });
          return;
        }
        void copyToClipboard(cartId).then((res) => {
          if (res.ok) setToast({ tone: "success", message: `cart-id copied via ${res.tool}` });
          else setToast({ tone: "error", message: `copy failed: ${res.reason} · cart-id ${cartId}` });
        });
        return;
      }
      if (input === "t") {
        const tok = getSession().customerToken;
        if (!tok) {
          setToast({ tone: "error", message: "no customer token in session" });
          return;
        }
        void copyToClipboard(tok).then((res) => {
          if (res.ok) setToast({ tone: "success", message: `customer token copied via ${res.tool}` });
          else setToast({ tone: "error", message: `copy failed: ${res.reason}` });
        });
        return;
      }
      if (input === "l") {
        setShowLog((v) => !v);
        return;
      }
      if (input === "j") {
        try {
          const file = writeSnapshot({
            email: state.email,
            payload: {
              email: state.email,
              store: state.store,
              capturedAt: new Date().toISOString(),
              customer: state.customer.status === "ok" ? state.customer.data : { error: errOf(state.customer) },
              cartSummary: state.cartSummary.status === "ok" ? state.cartSummary.data : { error: errOf(state.cartSummary) },
              cartDetail: state.cartDetail.status === "ok" ? state.cartDetail.data : { error: errOf(state.cartDetail) },
            },
          });
          setToast({ tone: "success", message: `dumped → ${file}` });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setToast({ tone: "error", message: `dump failed: ${msg}` });
        }
      }
    },
    { isActive: state.step === "results" }
  );

  return (
    <Box flexDirection="column">
      <Box key={state.step} flexDirection="column">
        {state.step === "email" && (
          <EmailView
            initial={state.email}
            onSubmit={handleEmail}
            onCancel={() => {
              clearModeState();
              onExit();
            }}
          />
        )}
        {state.step === "store" && (
          <StoreView initial={state.store || defaultStore} onSubmit={handleStore} onBack={goEmail} />
        )}
        {state.step === "acquiring" && (
          <AcquiringView
            email={state.email}
            store={state.store}
            error={state.acquireError}
            onRetry={() => setState((s) => ({ ...s, acquireError: null }))}
            onBack={() => {
              clearModeState();
              setState(initialBlitzState(defaultStore));
            }}
          />
        )}
        {state.step === "snapshot" && <SnapshotView state={state} />}
        {state.step === "results" && <ResultsView state={state} />}
        {state.step === "results" && showLog ? <LogStrip /> : null}
      </Box>
      {toast ? (
        <Box paddingX={2}>
          <Text color={toast.tone === "success" ? palette.success : palette.error}>
            {toast.tone === "success" ? "✓" : "✗"} {toast.message}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}

function errOf<T>(state: { status: "loading" | "ok" | "error"; message?: string }): string {
  return state.status === "error" ? state.message ?? "error" : "incomplete";
}
