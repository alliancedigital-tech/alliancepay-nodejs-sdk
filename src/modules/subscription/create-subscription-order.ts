import { API } from '../../core/constants/api';
import { IHttpClient } from '../../core/http/http-client.interface';
import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { SubscriptionOrderRequestSchema, SubscriptionOrderRequestDto, SubscriptionOrderResponseSchema, SubscriptionOrderResponseDto } from './dto/subscription-order.dto';
import { CreateSubscriptionOrderException } from '../../core/exceptions/base.exception';
import { SubscriptionOperation } from './subscription-operation';

export class CreateSubscriptionOrderService extends SubscriptionOperation<SubscriptionOrderRequestDto, SubscriptionOrderResponseDto> {
    constructor(httpClient: IHttpClient) {
        super(httpClient, API.ENDPOINT_SUBSCRIPTION_ORDER_CREATE, SubscriptionOrderRequestSchema, SubscriptionOrderResponseSchema, CreateSubscriptionOrderException);
    }

    public createSubscriptionOrder(request: unknown, auth: AuthorizationDto): Promise<SubscriptionOrderResponseDto> {
        return this.execute(request, auth);
    }
}
