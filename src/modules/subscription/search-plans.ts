import { API } from '../../core/constants/api';
import { IHttpClient } from '../../core/http/http-client.interface';
import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { SearchPlansRequestSchema, SearchPlansRequestDto, SearchPlansResponseSchema, SearchPlansResponseDto } from './dto/search-plans.dto';
import { SearchPlansException } from '../../core/exceptions/base.exception';
import { SubscriptionOperation } from './subscription-operation';

export class SearchPlansService extends SubscriptionOperation<SearchPlansRequestDto, SearchPlansResponseDto> {
    constructor(httpClient: IHttpClient) {
        super(httpClient, API.ENDPOINT_PLAN_SEARCH, SearchPlansRequestSchema, SearchPlansResponseSchema, SearchPlansException);
    }

    public searchPlans(request: unknown, auth: AuthorizationDto): Promise<SearchPlansResponseDto> {
        return this.execute(request, auth);
    }
}
