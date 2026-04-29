export const CUSTOMER_CART_SUMMARY_QUERY = /* GraphQL */ `
  query ArgusCartSummary {
    customerCart {
      id
      total_quantity
      prices {
        grand_total {
          value
          currency
        }
      }
    }
  }
`;

export interface CartSummaryResult {
  customerCart: {
    id: string;
    total_quantity: number | null;
    prices: {
      grand_total: { value: number | null; currency: string | null } | null;
    } | null;
  } | null;
}
