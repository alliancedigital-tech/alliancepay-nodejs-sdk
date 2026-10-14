import { API } from '../../core/constants/api';
import { IHttpClient } from '../../core/http/http-client.interface';
import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { SubscriptionOrderCancelRequestSchema, SubscriptionOrderCancelRequestDto, SubscriptionOrderCancelResponseSchema, SubscriptionOrderCancelResponseDto } from './dto/subscription-order.dto';
import { CancelSubscriptionOrderException } from '../../core/exceptions/base.exception';
import { SubscriptionOperation } from './subscription-operation';

export class CancelSubscriptionOrderService extends SubscriptionOperation<SubscriptionOrderCancelRequestDto, SubscriptionOrderCancelResponseDto> {
    constructor(httpClient: IHttpClient) {
        super(httpClient, API.ENDPOINT_SUBSCRIPTION_ORDER_CANCEL, SubscriptionOrderCancelRequestSchema, SubscriptionOrderCancelResponseSchema, CancelSubscriptionOrderException);
    }

    public cancelSubscriptionOrder(request: unknown, auth: AuthorizationDto): Promise<SubscriptionOrderCancelResponseDto> {
        return this.execute(request, auth);
    }
}
