import { CreateBillingTables1754352000000 } from "./1754352000000-create-billing-tables";
import { OneActivePaymentPerOrder1754352001000 } from "./1754352001000-one-active-payment-per-order";

export const DATABASE_MIGRATIONS = [
  CreateBillingTables1754352000000,
  OneActivePaymentPerOrder1754352001000,
] as const;
