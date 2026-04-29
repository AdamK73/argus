export const CUSTOMER_CART_DETAIL_QUERY = /* GraphQL */ `
  query ArgusCartDetail {
    customerCart {
      id
      items {
        uid
        quantity
        product {
          sku
          name
          url_key
        }
        prices {
          row_total {
            value
            currency
          }
        }
      }
      shipping_addresses {
        firstname
        lastname
        street
        city
        postcode
        country {
          code
        }
        selected_shipping_method {
          carrier_code
          method_code
          amount {
            value
            currency
          }
        }
      }
      billing_address {
        firstname
        lastname
        street
        city
        postcode
      }
      applied_coupons {
        code
      }
      prices {
        subtotal_excluding_tax {
          value
          currency
        }
        grand_total {
          value
          currency
        }
        applied_taxes {
          label
          amount {
            value
            currency
          }
        }
      }
      selected_payment_method {
        code
        title
      }
    }
  }
`;

export interface Money {
  value: number | null;
  currency: string | null;
}

export interface CartDetailResult {
  customerCart: {
    id: string;
    items: Array<{
      uid: string;
      quantity: number | null;
      product: { sku: string | null; name: string | null; url_key: string | null } | null;
      prices: { row_total: Money | null } | null;
    }> | null;
    shipping_addresses: Array<{
      firstname: string | null;
      lastname: string | null;
      street: string[] | null;
      city: string | null;
      postcode: string | null;
      country: { code: string | null } | null;
      selected_shipping_method: {
        carrier_code: string | null;
        method_code: string | null;
        amount: Money | null;
      } | null;
    }> | null;
    billing_address: {
      firstname: string | null;
      lastname: string | null;
      street: string[] | null;
      city: string | null;
      postcode: string | null;
    } | null;
    applied_coupons: Array<{ code: string }> | null;
    prices: {
      subtotal_excluding_tax: Money | null;
      grand_total: Money | null;
      applied_taxes: Array<{ label: string | null; amount: Money | null }> | null;
    } | null;
    selected_payment_method: { code: string | null; title: string | null } | null;
  } | null;
}
