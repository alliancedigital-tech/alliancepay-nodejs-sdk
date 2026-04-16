export class AllianceSdkException extends Error {
    public readonly code: string;
    public readonly originalError: any;

    constructor(message: string, code: string, originalError: any = null) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.originalError = originalError;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AuthorizationException extends AllianceSdkException {}
export class PaymentException extends AllianceSdkException {}
export class RefundException extends AllianceSdkException {}
export class GeneralApiException extends AllianceSdkException {}
