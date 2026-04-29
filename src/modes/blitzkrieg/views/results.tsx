import React from "react";
import { Box, Text, useStdout } from "ink";
import { palette } from "../../../ui/theme.js";
import { Panel } from "../../../ui/panel.js";
import { Table } from "../../../ui/table.js";
import type { BlitzState, PanelState } from "../machine.js";
import type { CustomerAddressesResult } from "../../../graphql/operations/customer-addresses.js";
import type { CartSummaryResult } from "../../../graphql/operations/customer-cart-summary.js";
import type { CartDetailResult } from "../../../graphql/operations/customer-cart-detail.js";

type Customer = NonNullable<CustomerAddressesResult["customer"]>;
type CartSummary = NonNullable<CartSummaryResult["customerCart"]>;
type CartDetail = NonNullable<CartDetailResult["customerCart"]>;

export interface ResultsViewProps {
  state: BlitzState;
}

export function ResultsView({ state }: ResultsViewProps): React.ReactElement {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  const wide = cols >= 140;
  const direction = wide ? "row" : "column";
  return (
    <Box flexDirection="column" paddingY={1}>
      <Box flexDirection={direction}>
        <CustomerPanel state={state.customer} wide={wide} />
        <CartSummaryPanel state={state.cartSummary} wide={wide} />
      </Box>
      <CartDetailPanel state={state.cartDetail} />
      <Box paddingX={2}>
        <Text color={palette.dim}>
          r refresh    c cart-id    t token    l log    j dump    b back    q quit
        </Text>
      </Box>
    </Box>
  );
}

function field(label: string, value: string): React.ReactElement {
  return (
    <Box>
      <Box width={14}>
        <Text color={palette.dim}>{label}</Text>
      </Box>
      <Text color={palette.fg}>{value}</Text>
    </Box>
  );
}

function CustomerPanel({ state, wide }: { state: PanelState<Customer | null>; wide: boolean }) {
  const flexGrow = wide ? 1 : undefined;
  if (state.status === "loading") {
    return (
      <Panel title="customer" flexGrow={flexGrow}>
        <Text color={palette.dim}>loading…</Text>
      </Panel>
    );
  }
  if (state.status === "error") {
    return (
      <Panel title="customer" tone="error" flexGrow={flexGrow}>
        <Text color={palette.error}>{state.message}</Text>
      </Panel>
    );
  }
  const c = state.data;
  if (!c) {
    return (
      <Panel title="customer" flexGrow={flexGrow}>
        <Text color={palette.dim}>no customer payload</Text>
      </Panel>
    );
  }
  const name = [c.firstname, c.lastname].filter(Boolean).join(" ") || "—";
  const addrs = c.addresses ?? [];
  const phones = collectPhones(addrs);
  return (
    <Panel title="customer" flexGrow={flexGrow}>
      {field("name", name)}
      {field("email", c.email ?? "—")}
      <PhonesField phones={phones} />
      <Box marginTop={1}>
        <Text color={palette.dim}>addresses ({addrs.length})</Text>
      </Box>
      {addrs.length === 0 ? (
        <Text color={palette.dim}>—</Text>
      ) : (
        addrs.map((a, i) => (
          <Box key={a.id ?? i} flexDirection="column" marginTop={1}>
            <Box>
              <Text color={palette.fg}>
                {[a.firstname, a.lastname].filter(Boolean).join(" ") || "—"}
              </Text>
              {a.default_billing || a.default_shipping ? (
                <Text color={palette.accent}>
                  {"  "}
                  {a.default_billing ? "billing " : ""}
                  {a.default_shipping ? "shipping" : ""}
                </Text>
              ) : null}
            </Box>
            <Text color={palette.dim}>
              {(a.street ?? []).join(", ")} · {a.city ?? "—"} {a.postcode ?? ""} · {a.country_code ?? "—"}
            </Text>
            {a.region?.region ? (
              <Text color={palette.dim}>
                {a.region.region} ({a.region.region_code ?? "—"})
              </Text>
            ) : null}
            {a.telephone ? (
              <Text color={phoneLooksValid(a.telephone) ? palette.dim : palette.warn}>
                phone {a.telephone}
                {phoneLooksValid(a.telephone) ? "" : "  ⚠ looks invalid"}
              </Text>
            ) : (
              <Text color={palette.warn}>phone —  ⚠ missing</Text>
            )}
          </Box>
        ))
      )}
    </Panel>
  );
}

interface PhoneEntry {
  raw: string;
  valid: boolean;
}

function collectPhones(addrs: Customer["addresses"]): PhoneEntry[] {
  const seen = new Set<string>();
  const out: PhoneEntry[] = [];
  for (const a of addrs ?? []) {
    const raw = (a.telephone ?? "").trim();
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);
    out.push({ raw, valid: phoneLooksValid(raw) });
  }
  return out;
}

function PhonesField({ phones }: { phones: PhoneEntry[] }): React.ReactElement {
  if (phones.length === 0) {
    return (
      <Box>
        <Box width={14}>
          <Text color={palette.dim}>phones</Text>
        </Box>
        <Text color={palette.warn}>—   ⚠ no phone on any address</Text>
      </Box>
    );
  }
  return (
    <Box flexDirection="column">
      {phones.map((p, i) => (
        <Box key={`${p.raw}-${i}`}>
          <Box width={14}>
            <Text color={palette.dim}>{i === 0 ? "phones" : ""}</Text>
          </Box>
          <Text color={p.valid ? palette.fg : palette.warn}>
            {p.raw}
            {p.valid ? "" : "   ⚠ looks invalid"}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

// Heuristic: digits 7..15 after stripping +, spaces, dashes, parens, dots.
// Catches the common bad cases — empty, garbage characters, too-short, far too-long.
function phoneLooksValid(raw: string): boolean {
  if (!raw) return false;
  const stripped = raw.replace(/[\s\-().]/g, "");
  const optionalPlus = stripped.startsWith("+") ? stripped.slice(1) : stripped;
  if (!/^[0-9]+$/.test(optionalPlus)) return false;
  return optionalPlus.length >= 7 && optionalPlus.length <= 15;
}

function CartSummaryPanel({ state, wide }: { state: PanelState<CartSummary | null>; wide: boolean }) {
  const flexGrow = wide ? 1 : undefined;
  if (state.status === "loading") {
    return (
      <Panel title="cart summary" flexGrow={flexGrow}>
        <Text color={palette.dim}>loading…</Text>
      </Panel>
    );
  }
  if (state.status === "error") {
    return (
      <Panel title="cart summary" tone="error" flexGrow={flexGrow}>
        <Text color={palette.error}>{state.message}</Text>
      </Panel>
    );
  }
  const c = state.data;
  if (!c) {
    return (
      <Panel title="cart summary" flexGrow={flexGrow}>
        <Text color={palette.dim}>no cart</Text>
      </Panel>
    );
  }
  return (
    <Panel title="cart summary" flexGrow={flexGrow}>
      {field("id", c.id)}
      {field("items", String(c.total_quantity ?? 0))}
      {field("grand total", formatMoney(c.prices?.grand_total ?? null))}
    </Panel>
  );
}

function CartDetailPanel({ state }: { state: PanelState<CartDetail | null> }) {
  if (state.status === "loading") {
    return (
      <Panel title="cart detail">
        <Text color={palette.dim}>loading…</Text>
      </Panel>
    );
  }
  if (state.status === "error") {
    return (
      <Panel title="cart detail" tone="error">
        <Text color={palette.error}>{state.message}</Text>
      </Panel>
    );
  }
  const c = state.data;
  if (!c) {
    return (
      <Panel title="cart detail">
        <Text color={palette.dim}>no cart</Text>
      </Panel>
    );
  }
  const items = c.items ?? [];
  const taxes = c.prices?.applied_taxes ?? [];
  const coupons = c.applied_coupons ?? [];
  const ship = c.shipping_addresses?.[0];
  const bill = c.billing_address;
  const pay = c.selected_payment_method;
  return (
    <Panel title="cart detail">
      <Box marginBottom={1}>
        <Text color={palette.dim}>items</Text>
      </Box>
      <Table
        columns={[
          { header: "sku", width: 18, render: (r) => r.product?.sku ?? "—" },
          { header: "name", width: 40, render: (r) => r.product?.name ?? "—" },
          { header: "qty", width: 5, render: (r) => String(r.quantity ?? 0) },
          { header: "row total", width: 14, render: (r) => formatMoney(r.prices?.row_total ?? null) },
        ]}
        rows={items}
        empty="no items"
      />
      <Box marginTop={1}>
        <Text color={palette.dim}>shipping</Text>
      </Box>
      {ship ? (
        <Box flexDirection="column">
          <Text color={palette.fg}>
            {[ship.firstname, ship.lastname].filter(Boolean).join(" ") || "—"}
          </Text>
          <Text color={palette.dim}>
            {(ship.street ?? []).join(", ")} · {ship.city ?? "—"} {ship.postcode ?? ""} · {ship.country?.code ?? "—"}
          </Text>
          {ship.selected_shipping_method ? (
            <Text color={palette.dim}>
              {ship.selected_shipping_method.carrier_code ?? "—"} / {ship.selected_shipping_method.method_code ?? "—"} ·{" "}
              {formatMoney(ship.selected_shipping_method.amount)}
            </Text>
          ) : (
            <Text color={palette.dim}>no shipping method selected</Text>
          )}
        </Box>
      ) : (
        <Text color={palette.dim}>no shipping address</Text>
      )}
      <Box marginTop={1}>
        <Text color={palette.dim}>billing</Text>
      </Box>
      {bill ? (
        <Box flexDirection="column">
          <Text color={palette.fg}>{[bill.firstname, bill.lastname].filter(Boolean).join(" ") || "—"}</Text>
          <Text color={palette.dim}>
            {(bill.street ?? []).join(", ")} · {bill.city ?? "—"} {bill.postcode ?? ""}
          </Text>
        </Box>
      ) : (
        <Text color={palette.dim}>no billing address</Text>
      )}
      <Box marginTop={1} flexDirection="column">
        {field("coupons", coupons.length === 0 ? "—" : coupons.map((c) => c.code).join(", "))}
        {field("payment", pay?.title ?? pay?.code ?? "—")}
      </Box>
      <Box marginTop={1}>
        <Text color={palette.dim}>totals</Text>
      </Box>
      {field("subtotal", formatMoney(c.prices?.subtotal_excluding_tax ?? null))}
      {taxes.map((t, i) => (
        <React.Fragment key={i}>{field(t.label ?? "tax", formatMoney(t.amount ?? null))}</React.Fragment>
      ))}
      {field("grand total", formatMoney(c.prices?.grand_total ?? null))}
    </Panel>
  );
}

function formatMoney(m: { value: number | null; currency: string | null } | null | undefined): string {
  if (!m || m.value == null) return "—";
  const v = m.value;
  const c = m.currency ?? "";
  return `${v.toFixed(2)} ${c}`.trim();
}
