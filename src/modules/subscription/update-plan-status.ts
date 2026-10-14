import { API } from '../../core/constants/api';
import { IHttpClient } from '../../core/http/http-client.interface';
import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { PlanStatusUpdateRequestSchema, PlanStatusUpdateRequestDto, PlanStatusUpdateResponseSchema, PlanStatusUpdateResponseDto } from './dto/plan-status-update.dto';
import { UpdatePlanStatusException } from '../../core/exceptions/base.exception';
import { SubscriptionOperation } from './subscription-operation';

export class UpdatePlanStatusService extends SubscriptionOperation<PlanStatusUpdateRequestDto, PlanStatusUpdateResponseDto> {
    constructor(httpClient: IHttpClient) {
        super(httpClient, API.ENDPOINT_PLAN_STATUS_UPDATE, PlanStatusUpdateRequestSchema, PlanStatusUpdateResponseSchema, UpdatePlanStatusException);
    }

    public updatePlanStatus(request: unknown, auth: AuthorizationDto): Promise<PlanStatusUpdateResponseDto> {
        return this.execute(request, auth);
    }
}
