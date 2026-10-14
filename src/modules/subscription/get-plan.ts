import { API } from '../../core/constants/api';
import { IHttpClient } from '../../core/http/http-client.interface';
import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { GetPlanRequestSchema, GetPlanRequestDto, PlanDetailsSchema, PlanDetailsDto } from './dto/get-plan.dto';
import { GetPlanException } from '../../core/exceptions/base.exception';
import { SubscriptionOperation } from './subscription-operation';

export class GetPlanService extends SubscriptionOperation<GetPlanRequestDto, PlanDetailsDto> {
    constructor(httpClient: IHttpClient) {
        super(httpClient, API.ENDPOINT_PLAN_GET, GetPlanRequestSchema, PlanDetailsSchema, GetPlanException);
    }

    public getPlan(request: unknown, auth: AuthorizationDto): Promise<PlanDetailsDto> {
        return this.execute(request, auth);
    }
}
