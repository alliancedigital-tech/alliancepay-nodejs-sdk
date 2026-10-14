import { describe, it, expect, vi } from 'vitest';
import { CreatePlanService } from './create-plan';
import { API } from '../../core/constants/api';
import { CreatePlanException } from '../../core/exceptions/base.exception';
import { ValidationException } from '../../core/exceptions/validation.exception';

const request = {
    merchantId: 'm1', name: 'n', description: 'd',
    rules: [{ paymentNumberFrom: 1, paymentNumberTo: 1, intervalValue: 1, intervalUnit: 'DAY', coinAmount: 100, currency: '980' }],
};
const response = { planId: 'p', versionId: 1, rules: request.rules };
const auth: any = {};

describe('CreatePlanService', () => {
    it('posts to the create endpoint and returns the parsed response', async () => {
        const http: any = { post: vi.fn().mockResolvedValue(response) };
        const result = await new CreatePlanService(http).createPlan(request, auth);
        expect(http.post).toHaveBeenCalledWith(API.ENDPOINT_PLAN_CREATE, request, auth);
        expect(result.planId).toBe('p');
    });
    it('validates before the HTTP call', async () => {
        const http: any = { post: vi.fn() };
        await expect(new CreatePlanService(http).createPlan({ ...request, description: undefined }, auth))
            .rejects.toBeInstanceOf(ValidationException);
        expect(http.post).not.toHaveBeenCalled();
    });
    it('wraps bank errors keeping the raw payload', async () => {
        const bank = { msgType: 'VALIDATION_ERROR', msgCode: 'X', msgText: 'description must not be blank' };
        const http: any = { post: vi.fn().mockResolvedValue(bank) };
        const err: any = await new CreatePlanService(http).createPlan(request, auth).catch(e => e);
        expect(err).toBeInstanceOf(CreatePlanException);
        expect(err.rawPayload).toEqual(bank);
    });
});
