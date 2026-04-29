export interface Session {
  adminKey: string | null;
  endpoint: string;
  endpointHost: string;
  customerToken: string | null;
  storeCode: string | null;
  customerEmail: string | null;
  startedAt: number;
}

export interface ArgusConfig {
  endpoint?: string;
  defaultStoreCode?: string;
  timeoutMs?: number;
}
