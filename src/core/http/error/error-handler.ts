import { AllianceSdkException } from '../../exceptions/base.exception';

export type ExceptionConstructor = new (message: string, code: string, originalError: any) => AllianceSdkException;

export class ApiErrorHandler {
    public static handle(
        ExceptionClass: ExceptionConstructor,
        error: any,
        manualStatus?: number
    ): never {
        const response = error.response?.data || error;
        const status = manualStatus || error.response?.status || 500;

        const msgType = response.msgType || 'ERROR';
        const msgCode = response.msgCode || status.toString();
        const msgText = response.msgText || error.message || 'No message text provided';
        const requestId = response.requestId || 'N/A';

        const formattedMessage = `[${status}] ${msgType} | ${msgCode}: ${msgText} (Request ID: ${requestId})`;

        throw new ExceptionClass(formattedMessage, msgCode, response);
    }

    public static checkResponse(ExceptionClass: ExceptionConstructor, response: any, status: number = 200): void {
        if (response?.msgType === 'ERROR' || response?.msgType === 'VALIDATION_ERROR') {
            this.handle(ExceptionClass, response, status);
        }
    }
}
