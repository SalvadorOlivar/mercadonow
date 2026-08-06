import type {
  AuthorizePaymentInput,
  AuthorizePaymentResult,
  PaymentGateway,
} from "../../../../application/ports/out/payment-gateway";

export class SandboxPaymentGateway implements PaymentGateway {
  authorize(input: AuthorizePaymentInput): Promise<AuthorizePaymentResult> {
    return Promise.resolve({
      authorized: true,
      providerReference: `sandbox-${input.paymentId}`,
    });
  }
}
