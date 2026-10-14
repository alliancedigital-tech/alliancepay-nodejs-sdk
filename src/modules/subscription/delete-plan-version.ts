import { API } from '../../core/constants/api';
import { IHttpClient } from '../../core/http/http-client.interface';
import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { PlanVersionDeleteRequestSchema, PlanVersionDeleteRequestDto, PlanVersionDeleteResponseSchema, PlanVersionDeleteResponseDto } from './dto/plan-version.dto';
import { DeletePlanVersionException } from '../../core/exceptions/base.exception';
import { SubscriptionOperation } from './subscription-operation';

export class DeletePlanVersionService extends SubscriptionOperation<PlanVersionDeleteRequestDto, PlanVersionDeleteResponseDto> {
    constructor(httpClient: IHttpClient) {
        super(httpClient, API.ENDPOINT_PLAN_VERSION_DELETE, PlanVersionDeleteRequestSchema, PlanVersionDeleteResponseSchema, DeletePlanVersionException);
    }

    public deletePlanVersion(request: unknown, auth: AuthorizationDto): Promise<PlanVersionDeleteResponseDto> {
        return this.execute(request, auth);
    }
}
