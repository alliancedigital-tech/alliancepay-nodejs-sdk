import { z } from 'zod';
import { IHttpClient } from '../../core/http/http-client.interface';
import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { DtoValidator } from '../../core/validator/dto-validator';
import { ApiErrorHandler, ExceptionConstructor } from '../../core/http/error/error-handler';
import { ValidationException } from '../../core/exceptions/validation.exception';

/**
 * Shared pipeline of one endpoint call: validate request -> POST (JWS) -> check bank error -> validate response.
 * No automatic retries: a repeated merchantRequestId creates a NEW object on the bank side.
 */
export abstract class SubscriptionOperation<TReq, TRes> {
    protected constructor(
        protected readonly httpClient: IHttpClient,
        private readonly endpoint: string,
        private readonly requestSchema: z.ZodType<TReq>,
        private readonly responseSchema: z.ZodType<TRes>,
        private readonly ExceptionClass: ExceptionConstructor
    ) {}

    protected async execute(request: unknown, auth: AuthorizationDto): Promise<TRes> {
        const validated = DtoValidator.validate(request, this.requestSchema);

        try {
            const response = await this.httpClient.post<unknown>(this.endpoint, validated, auth);
            ApiErrorHandler.checkResponse(this.ExceptionClass, response);
            return DtoValidator.validate(response, this.responseSchema);
        } catch (error) {
            if (error instanceof ValidationException || error instanceof this.ExceptionClass) {
                throw error;
            }
            ApiErrorHandler.handle(this.ExceptionClass, error);
        }
    }
}
