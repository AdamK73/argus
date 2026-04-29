import type { CartDetailResult } from "../../graphql/operations/customer-cart-detail.js";
import type { CartSummaryResult } from "../../graphql/operations/customer-cart-summary.js";
import type { CustomerAddressesResult } from "../../graphql/operations/customer-addresses.js";

export type Step =
  | "email"
  | "store"
  | "acquiring"
  | "snapshot"
  | "results"
  | "error";

export interface PanelStateOk<T> {
  status: "ok";
  data: T;
  fetchedAt: number;
}

export interface PanelStateErr {
  status: "error";
  message: string;
  fetchedAt: number;
}

export interface PanelStateLoading {
  status: "loading";
}

export type PanelState<T> = PanelStateOk<T> | PanelStateErr | PanelStateLoading;

export interface BlitzState {
  step: Step;
  email: string;
  store: string;
  emailError: string | null;
  acquireError: string | null;
  customer: PanelState<CustomerAddressesResult["customer"]>;
  cartSummary: PanelState<CartSummaryResult["customerCart"]>;
  cartDetail: PanelState<CartDetailResult["customerCart"]>;
}

export const initialBlitzState = (defaultStore = ""): BlitzState => ({
  step: "email",
  email: "",
  store: defaultStore,
  emailError: null,
  acquireError: null,
  customer: { status: "loading" },
  cartSummary: { status: "loading" },
  cartDetail: { status: "loading" },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s.trim());
}
