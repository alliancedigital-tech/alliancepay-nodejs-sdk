import { AuthorizationDto } from '../auth/dto/authorization.dto';
import { CreatePlanService } from './create-plan';
import { UpdatePlanService } from './update-plan';
import { UpdatePlanVersionService } from './update-plan-version';
import { PlanResponseDto } from './dto/plan-response.dto';
import { PlanLifecycleResult } from './plan-lifecycle-result';

/**
 * Create/update of a plan is always two steps: plan/create_v1|update_v1 followed by
 * plan/version/update_v1 {infiniteVersion: true}. Skipping the second step makes the bank silently
 * apply a hidden expiry date to the plan. A failure of step 2 is returned as a partial result, not thrown.
 */
export class PlanLifecycleOrchestrator {
    constructor(
        private readonly createPlanService: CreatePlanService,
        private readonly updatePlanService: UpdatePlanService,
        private readonly updatePlanVersionService: UpdatePlanVersionService
    ) {}

    public async createPlanWithInfiniteSchedule(request: unknown, auth: AuthorizationDto): Promise<PlanLifecycleResult> {
        const plan = await this.createPlanService.createPlan(request, auth);
        return this.applyInfiniteSchedule(plan, auth);
    }

    public async updatePlanWithInfiniteSchedule(request: unknown, auth: AuthorizationDto): Promise<PlanLifecycleResult> {
        const plan = await this.updatePlanService.updatePlan(request, auth);
        return this.applyInfiniteSchedule(plan, auth);
    }

    private async applyInfiniteSchedule(plan: PlanResponseDto, auth: AuthorizationDto): Promise<PlanLifecycleResult> {
        try {
            await this.updatePlanVersionService.updatePlanVersion(
                { planId: plan.planId, versionId: plan.versionId, infiniteVersion: true },
                auth
            );
            return new PlanLifecycleResult(plan, true);
        } catch (error: any) {
            return new PlanLifecycleResult(plan, false, error?.message ?? String(error), error);
        }
    }
}
