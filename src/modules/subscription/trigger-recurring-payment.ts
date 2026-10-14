import { API } from '../../core/constants/api';
import { IHttpClient } from '../../core/http/http-client.interface';
import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { RecurringPaymentTriggerRequestSchema, RecurringPaymentTriggerRequestDto, RecurringPaymentTriggerResponseSchema, RecurringPaymentTriggerResponseDto } from './dto/subscription-order.dto';
import { TriggerRecurringPaymentException } from '../../core/exceptions/base.exception';
import { SubscriptionOperation } from './subscription-operation';

export class TriggerRecurringPaymentService extends SubscriptionOperation<RecurringPaymentTriggerRequestDto, RecurringPaymentTriggerResponseDto> {
    constructor(httpClient: IHttpClient) {
        super(httpClient, API.ENDPOINT_RECURRING_PAYMENT_TRIGGER, RecurringPaymentTriggerRequestSchema, RecurringPaymentTriggerResponseSchema, TriggerRecurringPaymentException);
    }

    public triggerRecurringPayment(request: unknown, auth: AuthorizationDto): Promise<RecurringPaymentTriggerResponseDto> {
        return this.execute(request, auth);
    }
}
