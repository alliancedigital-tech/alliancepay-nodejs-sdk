import { describe, it, expect, vi } from 'vitest';
import { PlanLifecycleOrchestrator } from './plan-lifecycle-orchestrator';

const auth: any = {};
const plan = { planId: 'p1', versionId: 2, rules: [] };

function build(opts: { create?: any; versionUpdate?: any } = {}) {
    const create: any = { createPlan: opts.create ?? vi.fn().mockResolvedValue(plan) };
    const update: any = { updatePlan: vi.fn().mockResolvedValue(plan) };
    const version: any = { updatePlanVersion: opts.versionUpdate ?? vi.fn().mockResolvedValue({}) };
    return { orch: new PlanLifecycleOrchestrator(create, update, version), create, update, version };
}

describe('PlanLifecycleOrchestrator', () => {
    it('applies infinite schedule after create', async () => {
        const { orch, version } = build();
        const result = await orch.createPlanWithInfiniteSchedule({}, auth);
        expect(version.updatePlanVersion).toHaveBeenCalledWith({ planId: 'p1', versionId: 2, infiniteVersion: true }, auth);
        expect(result.isFullySuccessful()).toBe(true);
        expect(result.getPlanResponse()).toBe(plan);
    });
    it('applies infinite schedule after update too', async () => {
        const { orch, update, version } = build();
        await orch.updatePlanWithInfiniteSchedule({}, auth);
        expect(update.updatePlan).toHaveBeenCalled();
        expect(version.updatePlanVersion).toHaveBeenCalled();
    });
    it('returns a partial result when step 2 fails', async () => {
        const { orch } = build({ versionUpdate: vi.fn().mockRejectedValue(new Error('boom')) });
        const result = await orch.createPlanWithInfiniteSchedule({}, auth);
        expect(result.isFullySuccessful()).toBe(false);
        expect(result.getInfiniteScheduleApplied()).toBe(false);
        expect(result.getInfiniteScheduleError()).toBe('boom');
        expect(result.getPlanResponse()).toBe(plan);
    });
    it('throws when step 1 fails', async () => {
        const { orch, version } = build({ create: vi.fn().mockRejectedValue(new Error('nope')) });
        await expect(orch.createPlanWithInfiniteSchedule({}, auth)).rejects.toThrow('nope');
        expect(version.updatePlanVersion).not.toHaveBeenCalled();
    });
});
