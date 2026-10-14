import { API } from '../../core/constants/api';
import { IHttpClient } from '../../core/http/http-client.interface';
import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { PlanRequestSchema, PlanRequestDto } from './dto/plan-request.dto';
import { PlanResponseSchema, PlanResponseDto } from './dto/plan-response.dto';
import { CreatePlanException } from '../../core/exceptions/base.exception';
import { SubscriptionOperation } from './subscription-operation';

export class CreatePlanService extends SubscriptionOperation<PlanRequestDto, PlanResponseDto> {
    constructor(httpClient: IHttpClient) {
        super(httpClient, API.ENDPOINT_PLAN_CREATE, PlanRequestSchema, PlanResponseSchema, CreatePlanException);
    }

    public createPlan(request: unknown, auth: AuthorizationDto): Promise<PlanResponseDto> {
        return this.execute(request, auth);
    }
}
