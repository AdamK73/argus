import { call } from "../../graphql/client.js";
import {
  GENERATE_CUSTOMER_TOKEN_AS_ADMIN,
  type GenerateCustomerTokenAsAdminResult,
} from "../../graphql/operations/customer-token-as-admin.js";
import {
  CUSTOMER_ADDRESSES_QUERY,
  type CustomerAddressesResult,
} from "../../graphql/operations/customer-addresses.js";
import {
  CUSTOMER_CART_SUMMARY_QUERY,
  type CartSummaryResult,
} from "../../graphql/operations/customer-cart-summary.js";
import {
  CUSTOMER_CART_DETAIL_QUERY,
  type CartDetailResult,
} from "../../graphql/operations/customer-cart-detail.js";
import { setCustomerToken, setStoreCode, setCustomerEmail } from "../../session/store.js";

export type AcquireOutcome =
  | { ok: true; token: string }
  | { ok: false; reason: string };

export async function acquireCustomerToken(email: string, store: string): Promise<AcquireOutcome> {
  setStoreCode(store);
  setCustomerEmail(email);
  const res = await call<GenerateCustomerTokenAsAdminResult>({
    query: GENERATE_CUSTOMER_TOKEN_AS_ADMIN,
    variables: { email },
    operationName: "ArgusGenerateCustomerTokenAsAdmin",
    authMode: "admin",
    storeCode: store,
  });
  if (res.errors && res.errors.length > 0) {
    return { ok: false, reason: res.errors.map((e) => e.message).join(" · ") };
  }
  const token = res.data?.generateCustomerTokenAsAdmin?.customer_token;
  if (!token) {
    return { ok: false, reason: `no token returned (status ${res.status})` };
  }
  setCustomerToken(token);
  return { ok: true, token };
}

export interface SnapshotResults {
  customer: PanelOutcome<CustomerAddressesResult["customer"]>;
  cartSummary: PanelOutcome<CartSummaryResult["customerCart"]>;
  cartDetail: PanelOutcome<CartDetailResult["customerCart"]>;
}

export type PanelOutcome<T> = { ok: true; data: T } | { ok: false; message: string };

export async function runSnapshot(store: string): Promise<SnapshotResults> {
  const [customer, summary, detail] = await Promise.allSettled([
    call<CustomerAddressesResult>({
      query: CUSTOMER_ADDRESSES_QUERY,
      operationName: "ArgusCustomerAddresses",
      authMode: "customer",
      storeCode: store,
    }),
    call<CartSummaryResult>({
      query: CUSTOMER_CART_SUMMARY_QUERY,
      operationName: "ArgusCartSummary",
      authMode: "customer",
      storeCode: store,
    }),
    call<CartDetailResult>({
      query: CUSTOMER_CART_DETAIL_QUERY,
      operationName: "ArgusCartDetail",
      authMode: "customer",
      storeCode: store,
    }),
  ]);

  return {
    customer: extract(customer, (d: CustomerAddressesResult) => d.customer ?? null),
    cartSummary: extract(summary, (d: CartSummaryResult) => d.customerCart ?? null),
    cartDetail: extract(detail, (d: CartDetailResult) => d.customerCart ?? null),
  };
}

function extract<TIn, TOut>(
  settled: PromiseSettledResult<{
    data: TIn | null;
    errors?: { message: string }[];
    status: number;
  }>,
  pick: (data: TIn) => TOut
): PanelOutcome<TOut> {
  if (settled.status === "rejected") {
    return { ok: false, message: settled.reason instanceof Error ? settled.reason.message : String(settled.reason) };
  }
  const v = settled.value;
  if (v.errors && v.errors.length > 0) {
    return { ok: false, message: v.errors.map((e) => e.message).join(" · ") };
  }
  if (!v.data) {
    return { ok: false, message: `empty payload (status ${v.status})` };
  }
  return { ok: true, data: pick(v.data) };
}
