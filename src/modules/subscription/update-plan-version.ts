import { API } from '../../core/constants/api';
import { IHttpClient } from '../../core/http/http-client.interface';
import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { PlanVersionUpdateRequestSchema, PlanVersionUpdateRequestDto } from './dto/plan-version.dto';
import { PlanResponseSchema, PlanResponseDto } from './dto/plan-response.dto';
import { UpdatePlanVersionException } from '../../core/exceptions/base.exception';
import { SubscriptionOperation } from './subscription-operation';

export class UpdatePlanVersionService extends SubscriptionOperation<PlanVersionUpdateRequestDto, PlanResponseDto> {
    constructor(httpClient: IHttpClient) {
        super(httpClient, API.ENDPOINT_PLAN_VERSION_UPDATE, PlanVersionUpdateRequestSchema, PlanResponseSchema, UpdatePlanVersionException);
    }

    public updatePlanVersion(request: unknown, auth: AuthorizationDto): Promise<PlanResponseDto> {
        return this.execute(request, auth);
    }
}
