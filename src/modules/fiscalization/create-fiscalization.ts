import { API } from '../../core/constants/api';
import { IHttpClient } from '../../core/http/http-client.interface';
import { FiscalizationException } from '../../core/exceptions/base.exception';
import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { SubscriptionOperation } from '../subscription/subscription-operation';
import {
    FiscalizationRequestDto,
    FiscalizationRequestSchema,
    normalizeFiscalizationRequest,
} from './dto/fiscalization-request.dto';
import { FiscalizationResponseDto, FiscalizationResponseSchema } from './dto/fiscalization-response.dto';

/**
 * No automatic retries. A FAIL status is returned as a normal response (HTTP 200), not thrown;
 * 400/5xx/timeouts are thrown as FiscalizationException (code = bank msgCode, rawPayload.msgAttrs = field names).
 */
export class CreateFiscalizationService extends SubscriptionOperation<FiscalizationRequestDto, FiscalizationResponseDto> {
    constructor(httpClient: IHttpClient) {
        super(httpClient, API.ENDPOINT_FISCALIZATION_CREATE, FiscalizationRequestSchema, FiscalizationResponseSchema, FiscalizationException);
    }

    public createFiscalization(request: unknown, auth: AuthorizationDto): Promise<FiscalizationResponseDto> {
        return this.execute(normalizeFiscalizationRequest(request), auth);
    }
}
