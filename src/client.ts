import {FetchAdapter} from './core/http/adapters/fetch-adapter';
import {RequestBuilder} from './core/http/request/request-builder';
import {IHttpClient} from './core/http/http-client.interface';
import {AuthorizationDto, AuthorizationSchema} from './modules/auth/dto/authorization.dto';
import {DtoValidator} from './core/validator/dto-validator';
import {CreateOrderService} from './modules/payment/create-order';
import {OrderResponseDto} from './modules/payment/dto/order-response.dto';
import {OrderRequestDto} from './modules/payment/dto/order-request.dto';
import {GenerateRequestIdentification} from './core/utils/request-identification';
import {RefundResponseDto} from './modules/refund/dto/refund-response.dto';
import {CreateRefundService} from './modules/refund/create-refund';
import {RefundRequestDto} from './modules/refund/dto/refund-request.dto';
import {DateTimeProvider} from './core/utils/date-time.provider';
import {CallbackDto} from './modules/callback/dto/callback.dto';
import {CallbackHandler} from "./modules/callback/process-callback";
import {OrderDataResponseDto} from "./modules/payment/dto/order-data-response";
import {CheckOrderService} from "./modules/payment/check-order";
import {CreateCompletionService} from './modules/payment/create-completion';
import {CompletionResponseDto} from './modules/payment/dto/completion-response.dto';
import {CompletionRequestDto} from './modules/payment/dto/create-completion-request.dto';
import {HPP_PAY_TYPES} from "./core/constants/api";
import {CreatePlanService} from './modules/subscription/create-plan';
import {UpdatePlanService} from './modules/subscription/update-plan';
import {UpdatePlanStatusService} from './modules/subscription/update-plan-status';
import {UpdatePlanVersionService} from './modules/subscription/update-plan-version';
import {DeletePlanVersionService} from './modules/subscription/delete-plan-version';
import {GetPlanService} from './modules/subscription/get-plan';
import {SearchPlansService} from './modules/subscription/search-plans';
import {CreateSubscriptionOrderService} from './modules/subscription/create-subscription-order';
import {CancelSubscriptionOrderService} from './modules/subscription/cancel-subscription-order';
import {TriggerRecurringPaymentService} from './modules/subscription/trigger-recurring-payment';
import {PlanLifecycleOrchestrator} from './modules/subscription/plan-lifecycle-orchestrator';
import {PlanLifecycleResult} from './modules/subscription/plan-lifecycle-result';
import {SubscriptionCallbackHandler} from './modules/subscription/subscription-callback-handler';
import {SubscriptionCallbackDTO} from './modules/subscription/dto/subscription-callback.dto';
import {PlanStatusUpdateResponseDto} from './modules/subscription/dto/plan-status-update.dto';
import {PlanVersionDeleteResponseDto} from './modules/subscription/dto/plan-version.dto';
import {PlanDetailsDto} from './modules/subscription/dto/get-plan.dto';
import {SearchPlansResponseDto} from './modules/subscription/dto/search-plans.dto';
import {
    SubscriptionOrderResponseDto,
    SubscriptionOrderCancelResponseDto,
    RecurringPaymentTriggerResponseDto,
} from './modules/subscription/dto/subscription-order.dto';
import {FiscalizationException} from './core/exceptions/base.exception';
import {CreateFiscalizationService} from './modules/fiscalization/create-fiscalization';
import {FiscalizationCallbackHandler} from './modules/fiscalization/fiscalization-callback-handler';
import {FiscalizationResponseDto, FiscalizationCallbackDTO} from './modules/fiscalization/dto/fiscalization-response.dto';

export * from './core/exceptions/base.exception';
export {ValidationException} from './core/exceptions/validation.exception';
export {PlanLifecycleResult} from './modules/subscription/plan-lifecycle-result';
export {SubscriptionCallbackDTO} from './modules/subscription/dto/subscription-callback.dto';
export {parseBankDate} from './modules/subscription/dto/plan-response.dto';
export {FiscalizationCallbackDTO} from './modules/fiscalization/dto/fiscalization-response.dto';
export type {FiscalizationResponseDto} from './modules/fiscalization/dto/fiscalization-response.dto';
export type {FiscalizationRequestDto, FiscalProductDto} from './modules/fiscalization/dto/fiscalization-request.dto';
export {resolveFiscalProductFields, parseExciseLabels} from './modules/fiscalization/fiscal-product-resolver';
export type {FiscalAttrs, ResolvedFiscalFields} from './modules/fiscalization/fiscal-product-resolver';
export {buildFiscalProducts} from './modules/fiscalization/fiscal-products-builder';
export type {FiscalLineInput, BuildFiscalProductsOptions} from './modules/fiscalization/fiscal-products-builder';
export {shouldApplyFiscalizationUpdate} from './modules/fiscalization/fiscalization-status';
export {
    FISCAL_DEFAULT_MEASUREMENT_CODE,
    FISCAL_CLASSIFICATION_REQUIRED_TAX_CODES,
    FISCALIZATION_STATUS,
    FISCALIZATION_OPERATION_TYPE,
    FISCALIZATION_ERROR_CODES,
} from './modules/fiscalization/fiscalization.constants';
export type {PlanRequestDto, PlanRuleDto} from './modules/subscription/dto/plan-request.dto';
export type {PlanResponseDto} from './modules/subscription/dto/plan-response.dto';
export type {PlanDetailsDto} from './modules/subscription/dto/get-plan.dto';
export type {SearchPlansResponseDto} from './modules/subscription/dto/search-plans.dto';

export interface AllianceSDKConfig {
    authentificationData: AuthorizationDto;
    httpClient?: IHttpClient;
    /** Optional timeout (ms) of the default HTTP client; ignored when `httpClient` is supplied. */
    timeoutMs?: number;
}

export class AllianceBankClient {
    private config: AllianceSDKConfig;
    private readonly http: IHttpClient;
    private readonly requestBuilder: RequestBuilder;
    private createOrderService: CreateOrderService;
    private createRefundService: CreateRefundService;
    private createCompletionService: CreateCompletionService;
    private callbackHandler: CallbackHandler;
    private checkOrderService: CheckOrderService;
    private planLifecycle: PlanLifecycleOrchestrator;
    private updatePlanStatusService: UpdatePlanStatusService;
    private deletePlanVersionService: DeletePlanVersionService;
    private getPlanService: GetPlanService;
    private searchPlansService: SearchPlansService;
    private createSubscriptionOrderService: CreateSubscriptionOrderService;
    private cancelSubscriptionOrderService: CancelSubscriptionOrderService;
    private triggerRecurringPaymentService: TriggerRecurringPaymentService;
    private subscriptionCallbackHandler: SubscriptionCallbackHandler;
    private createFiscalizationService: CreateFiscalizationService;
    private fiscalizationCallbackHandler: FiscalizationCallbackHandler;

    constructor(config: AllianceSDKConfig) {
        this.config = config;
        this.requestBuilder = new RequestBuilder();
        this.http = config.httpClient ?? new FetchAdapter(
            config.authentificationData.baseUrl,
            this.requestBuilder,
            config.timeoutMs
        );
        this.createOrderService = new CreateOrderService(this.http);
        this.createRefundService = new CreateRefundService(this.http);
        this.createCompletionService = new CreateCompletionService(this.http);
        this.callbackHandler = new CallbackHandler();
        this.checkOrderService = new CheckOrderService(this.http);
        this.planLifecycle = new PlanLifecycleOrchestrator(
            new CreatePlanService(this.http),
            new UpdatePlanService(this.http),
            new UpdatePlanVersionService(this.http)
        );
        this.updatePlanStatusService = new UpdatePlanStatusService(this.http);
        this.deletePlanVersionService = new DeletePlanVersionService(this.http);
        this.getPlanService = new GetPlanService(this.http);
        this.searchPlansService = new SearchPlansService(this.http);
        this.createSubscriptionOrderService = new CreateSubscriptionOrderService(this.http);
        this.cancelSubscriptionOrderService = new CancelSubscriptionOrderService(this.http);
        this.triggerRecurringPaymentService = new TriggerRecurringPaymentService(this.http);
        this.subscriptionCallbackHandler = new SubscriptionCallbackHandler();
        this.createFiscalizationService = new CreateFiscalizationService(this.http);
        this.fiscalizationCallbackHandler = new FiscalizationCallbackHandler();
    }

    private validatedAuth(): AuthorizationDto {
        return DtoValidator.validate(this.config.authentificationData, AuthorizationSchema);
    }

    public async createOrder(orderData: object): Promise<OrderResponseDto | object> {
        const authDto: AuthorizationDto = this.validatedAuth();

        const typedOrderData = orderData as Record<string, any>;
        let preAuthExpDate = typedOrderData.preAuthExpDate ?? null;

        if (typedOrderData.hppPayType === HPP_PAY_TYPES.PREAUTH && preAuthExpDate === null) {
            preAuthExpDate = DateTimeProvider.formattedPreAuthExpDate();
        }

        const updatedOrderData = {
            ...orderData,
            merchantId: authDto.merchantId,
            merchantRequestId: GenerateRequestIdentification.generateRequestId(),
            preAuthExpDate,
        };

        const createOrderResponse = await this.createOrderService.createOrder(
            updatedOrderData as OrderRequestDto,
            authDto
        );

        return createOrderResponse as OrderResponseDto;
    }

    public async createRefund(refundData: object): Promise<RefundResponseDto> {
        const authDto: AuthorizationDto = this.validatedAuth();

        const updatedRefundData = {
            ...refundData,
            merchantId: authDto.merchantId,
            merchantRequestId: GenerateRequestIdentification.generateRequestId(),
            date: DateTimeProvider.formattedRefundDate()
        };

        const createRefundResponse = await this.createRefundService.createRefund(
            updatedRefundData as RefundRequestDto,
            authDto
        );

        return createRefundResponse as RefundResponseDto;
    }

    public async createCompletion(
        completionData: object,
        originalCoinAmount: number
    ): Promise<CompletionResponseDto> {
        const authDto: AuthorizationDto = this.validatedAuth();

        const updatedCompletionData = {
            ...completionData,
            merchantId: authDto.merchantId,
            merchantRequestId: GenerateRequestIdentification.generateRequestId(),
            date: DateTimeProvider.formattedRefundDate(),
        };

        return await this.createCompletionService.createCompletion(
            updatedCompletionData as CompletionRequestDto,
            originalCoinAmount,
            authDto
        );
    }

    public async handleCallback(data: any): Promise<CallbackDto> {
        return this.callbackHandler.handle(data, { baseUrl: this.config.authentificationData.baseUrl });
    }

    public async checkOrderData(hppOrderId: string): Promise<OrderDataResponseDto> {
        const authDto: AuthorizationDto = this.validatedAuth();

        const orderData = await this.checkOrderService.checkOrderData(hppOrderId, authDto);

        return orderData as OrderDataResponseDto;
    }

    public async createPlanWithInfiniteSchedule(planData: object): Promise<PlanLifecycleResult> {
        const authDto = this.validatedAuth();
        return this.planLifecycle.createPlanWithInfiniteSchedule(
            {...planData, merchantId: authDto.merchantId}, authDto
        );
    }

    public async updatePlanWithInfiniteSchedule(planData: object): Promise<PlanLifecycleResult> {
        const authDto = this.validatedAuth();
        return this.planLifecycle.updatePlanWithInfiniteSchedule(
            {...planData, merchantId: authDto.merchantId}, authDto
        );
    }

    public async updatePlanStatus(data: object): Promise<PlanStatusUpdateResponseDto> {
        const authDto = this.validatedAuth();
        return this.updatePlanStatusService.updatePlanStatus({...data, merchantId: authDto.merchantId}, authDto);
    }

    public async deletePlanVersion(data: object): Promise<PlanVersionDeleteResponseDto> {
        const authDto = this.validatedAuth();
        return this.deletePlanVersionService.deletePlanVersion(data, authDto);
    }

    public async getPlan(data: object): Promise<PlanDetailsDto> {
        const authDto = this.validatedAuth();
        return this.getPlanService.getPlan({...data, merchantId: authDto.merchantId}, authDto);
    }

    public async searchPlans(data: object = {}): Promise<SearchPlansResponseDto> {
        const authDto = this.validatedAuth();
        return this.searchPlansService.searchPlans({...data, merchantId: authDto.merchantId}, authDto);
    }

    public async createSubscriptionOrder(data: object): Promise<SubscriptionOrderResponseDto> {
        const authDto = this.validatedAuth();
        return this.createSubscriptionOrderService.createSubscriptionOrder({
            ...data,
            merchantId: authDto.merchantId,
            merchantRequestId: GenerateRequestIdentification.generateRequestId(),
        }, authDto);
    }

    public async cancelSubscriptionOrder(data: object): Promise<SubscriptionOrderCancelResponseDto> {
        const authDto = this.validatedAuth();
        return this.cancelSubscriptionOrderService.cancelSubscriptionOrder({
            ...data,
            merchantId: authDto.merchantId,
            merchantRequestId: GenerateRequestIdentification.generateRequestId(),
        }, authDto);
    }

    public async triggerRecurringPayment(data: object): Promise<RecurringPaymentTriggerResponseDto> {
        const authDto = this.validatedAuth();
        return this.triggerRecurringPaymentService.triggerRecurringPayment({
            ...data,
            merchantId: authDto.merchantId,
            merchantRequestId: GenerateRequestIdentification.generateRequestId(),
        }, authDto);
    }

    public async handleSubscriptionCallback(
        rawBody: unknown,
        opts: { allowUnsigned?: boolean } = {}
    ): Promise<SubscriptionCallbackDTO> {
        return this.subscriptionCallbackHandler.handle(rawBody, {
            baseUrl: this.config.authentificationData.baseUrl,
            allowUnsigned: opts.allowUnsigned,
        });
    }

    /**
     * Fiscalizes a successful PURCHASE/REFUND operation. `notificationUrl` and `products` are required.
     * Pass your own `merchantRequestId` (1..36 chars) to make a retry idempotent; otherwise one is generated.
     * On failure the used id is available in `error.rawPayload.merchantRequestId`.
     * No automatic retries: after a timeout check the receipt status first, then retry with the SAME id.
     */
    public async createFiscalization(data: object): Promise<FiscalizationResponseDto> {
        const authDto = this.validatedAuth();
        const provided = (data as Record<string, unknown>).merchantRequestId;
        const merchantRequestId = typeof provided === 'string' && provided !== ''
            ? provided
            : GenerateRequestIdentification.generateRequestId();

        try {
            return await this.createFiscalizationService.createFiscalization({
                ...data,
                merchantId: authDto.merchantId,
                merchantRequestId,
            }, authDto);
        } catch (error) {
            if (error instanceof FiscalizationException) {
                const raw = error.rawPayload;
                const payload = raw && typeof raw === 'object' && !Array.isArray(raw)
                    ? { ...raw, merchantRequestId }
                    : { cause: raw ?? null, merchantRequestId };
                throw new FiscalizationException(error.message, error.code, payload);
            }
            throw error;
        }
    }

    public async handleFiscalizationCallback(
        rawBody: unknown,
        opts: { allowUnsigned?: boolean } = {}
    ): Promise<FiscalizationCallbackDTO> {
        return this.fiscalizationCallbackHandler.handle(rawBody, {
            baseUrl: this.config.authentificationData.baseUrl,
            allowUnsigned: opts.allowUnsigned,
        });
    }
}
