export const GENERATE_CUSTOMER_TOKEN_AS_ADMIN = /* GraphQL */ `
  mutation ArgusGenerateCustomerTokenAsAdmin($email: String!) {
    generateCustomerTokenAsAdmin(input: { customer_email: $email }) {
      customer_token
    }
  }
`;

export interface GenerateCustomerTokenAsAdminResult {
  generateCustomerTokenAsAdmin: {
    customer_token: string | null;
  } | null;
}
