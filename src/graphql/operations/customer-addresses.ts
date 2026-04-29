export const CUSTOMER_ADDRESSES_QUERY = /* GraphQL */ `
  query ArgusCustomerAddresses {
    customer {
      firstname
      lastname
      email
      addresses {
        id
        firstname
        lastname
        street
        city
        region {
          region
          region_code
        }
        postcode
        country_code
        telephone
        default_billing
        default_shipping
      }
    }
  }
`;

export interface CustomerAddressesResult {
  customer: {
    firstname: string | null;
    lastname: string | null;
    email: string | null;
    addresses: Array<{
      id: number | null;
      firstname: string | null;
      lastname: string | null;
      street: string[] | null;
      city: string | null;
      region: { region: string | null; region_code: string | null } | null;
      postcode: string | null;
      country_code: string | null;
      telephone: string | null;
      default_billing: boolean | null;
      default_shipping: boolean | null;
    }> | null;
  } | null;
}
