import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AllianceBankClient } from './client';
import { AuthService } from './modules/auth/authorization';
import { CreateOrderService } from './modules/payment/create-order';
import { CreateRefundService } from './modules/refund/create-refund';
import { CallbackHandler } from './modules/callback/process-callback';
import { CheckOrderService } from './modules/payment/check-order';
import { GenerateRequestIdentification } from './core/utils/request-identification';
import { DateTimeProvider } from './core/utils/date-time.provider';

vi.mock('./modules/auth/authorization');
vi.mock('./modules/payment/create-order');
vi.mock('./modules/refund/create-refund');
vi.mock('./modules/callback/process-callback');
vi.mock('./modules/payment/check-order');
vi.mock('./core/utils/request-identification');
vi.mock('./core/utils/date-time.provider');

describe('AllianceBankClient', () => {
    let client: AllianceBankClient;
    const mockConfig = {
        authentificationData: {
            baseUrl: 'https://api.test.com',
            merchantId: 'M123',
            serviceCode: 'S001',
            authenticationKey: {}
        } as any
    };

    const mockAuthResult = {
        merchantId: 'M123',
        authToken: 'valid-token'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(AuthService.prototype.authorize).mockResolvedValue(mockAuthResult as any);
        vi.mocked(GenerateRequestIdentification.generateRequestId).mockReturnValue('req-id-123');
        vi.mocked(DateTimeProvider.formattedRefundDate).mockReturnValue('2026-03-23 12:00:00');

        client = new AllianceBankClient(mockConfig);
    });

    describe('Initialization', () => {
        it('should instantiate correctly with lazy services', () => {
            expect(client.auth).toBeDefined();
            expect(client.encryption).toBeDefined();
        });
    });

    describe('authorize', () => {
        it('should call auth service with config data', async () => {
            await client.authorize();
            expect(client.auth.authorize).toHaveBeenCalledWith(mockConfig.authentificationData);
        });
    });

    describe('createOrder', () => {
        it('should authorize, inject metadata, and call createOrderService', async () => {
            const orderData = { coinAmount: 1000 };
            const mockResponse = { hppOrderId: 'order-1' };

            vi.mocked(CreateOrderService.prototype.createOrder).mockResolvedValue(mockResponse as any);

            const result = await client.createOrder(orderData);

            expect(client.auth.authorize).toHaveBeenCalled();

            expect(CreateOrderService.prototype.createOrder).toHaveBeenCalledWith(
                expect.objectContaining({
                    coinAmount: 1000,
                    merchantId: 'M123',
                    merchantRequestId: 'req-id-123'
                }),
                mockAuthResult
            );

            expect(result).toEqual(mockResponse);
        });
    });

    describe('createRefund', () => {
        it('should inject merchantId, requestId, and formatted date', async () => {
            const refundData = { rrn: 'rrn-1' };
            vi.mocked(CreateRefundService.prototype.createRefund).mockResolvedValue({ status: 'SUCCESS' } as any);

            await client.createRefund(refundData);

            expect(CreateRefundService.prototype.createRefund).toHaveBeenCalledWith(
                expect.objectContaining({
                    rrn: 'rrn-1',
                    merchantId: 'M123',
                    merchantRequestId: 'req-id-123',
                    date: '2026-03-23 12:00:00'
                }),
                mockAuthResult
            );
        });
    });

    describe('handleCallback', () => {
        it('should delegate handling to CallbackHandler', async () => {
            const rawData = { some: 'payload' };
            vi.mocked(CallbackHandler.prototype.handle).mockResolvedValue({ ecomOrderId: '123' } as any);

            await client.handleCallback(rawData);

            expect(CallbackHandler.prototype.handle).toHaveBeenCalledWith(rawData);
        });
    });

    describe('checkOrderData', () => {
        it('should authorize and call checkOrderService', async () => {
            const hppId = 'hpp-555';
            vi.mocked(CheckOrderService.prototype.checkOrderData).mockResolvedValue({ orderStatus: 'PAID' } as any);

            await client.checkOrderData(hppId);

            expect(client.auth.authorize).toHaveBeenCalled();
            expect(CheckOrderService.prototype.checkOrderData).toHaveBeenCalledWith(hppId, mockAuthResult);
        });
    });
});
