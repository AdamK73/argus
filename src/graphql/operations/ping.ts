export const PING_QUERY = /* GraphQL */ `
  query ArgusPing {
    storeConfig {
      store_code
      default_display_currency_code
    }
  }
`;

export interface PingResult {
  storeConfig: {
    store_code: string | null;
    default_display_currency_code: string | null;
  } | null;
}
