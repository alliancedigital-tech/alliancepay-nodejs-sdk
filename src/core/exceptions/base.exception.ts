export class AllianceSdkException extends Error {
    public readonly code: string;
    public readonly originalError: any;
    public readonly rawPayload: unknown;

    constructor(message: string, code: string, originalError: any = null) {
        super(message, originalError instanceof Error ? { cause: originalError } : undefined);
        this.name = this.constructor.name;
        this.code = code;
        this.originalError = originalError;
        this.rawPayload = originalError;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class PaymentException extends AllianceSdkException {}
export class RefundException extends AllianceSdkException {}
export class GeneralApiException extends AllianceSdkException {}
export class CompletionException extends AllianceSdkException {}
export class CompletionAmountException extends AllianceSdkException {}
export class JwsSigningException extends AllianceSdkException {}
export class JwsVerificationException extends AllianceSdkException {}

export class CreatePlanException extends AllianceSdkException {}
export class UpdatePlanException extends AllianceSdkException {}
export class UpdatePlanStatusException extends AllianceSdkException {}
export class UpdatePlanVersionException extends AllianceSdkException {}
export class DeletePlanVersionException extends AllianceSdkException {}
export class GetPlanException extends AllianceSdkException {}
export class SearchPlansException extends AllianceSdkException {}
export class CreateSubscriptionOrderException extends AllianceSdkException {}
export class CancelSubscriptionOrderException extends AllianceSdkException {}
export class TriggerRecurringPaymentException extends AllianceSdkException {}
