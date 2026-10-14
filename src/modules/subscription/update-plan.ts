import { API } from '../../core/constants/api';
import { IHttpClient } from '../../core/http/http-client.interface';
import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { PlanUpdateRequestSchema, PlanUpdateRequestDto } from './dto/plan-request.dto';
import { PlanResponseSchema, PlanResponseDto } from './dto/plan-response.dto';
import { UpdatePlanException } from '../../core/exceptions/base.exception';
import { SubscriptionOperation } from './subscription-operation';

export class UpdatePlanService extends SubscriptionOperation<PlanUpdateRequestDto, PlanResponseDto> {
    constructor(httpClient: IHttpClient) {
        super(httpClient, API.ENDPOINT_PLAN_UPDATE, PlanUpdateRequestSchema, PlanResponseSchema, UpdatePlanException);
    }

    public updatePlan(request: unknown, auth: AuthorizationDto): Promise<PlanResponseDto> {
        return this.execute(request, auth);
    }
}
