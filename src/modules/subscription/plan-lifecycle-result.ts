import { PlanResponseDto } from './dto/plan-response.dto';

/** Outcome of create/update plan + the mandatory "infinite schedule" second step. */
export class PlanLifecycleResult {
    constructor(
        private readonly planResponse: PlanResponseDto,
        private readonly infiniteScheduleApplied: boolean,
        private readonly infiniteScheduleError: string | null = null,
        private readonly infiniteScheduleRawError: unknown = null
    ) {}

    public isFullySuccessful(): boolean {
        return this.infiniteScheduleApplied;
    }

    public getPlanResponse(): PlanResponseDto {
        return this.planResponse;
    }

    public getInfiniteScheduleApplied(): boolean {
        return this.infiniteScheduleApplied;
    }

    public getInfiniteScheduleError(): string | null {
        return this.infiniteScheduleError;
    }

    public getInfiniteScheduleRawError(): unknown {
        return this.infiniteScheduleRawError;
    }
}
