import {FetchAdapter} from './core/http/adapters/fetch-adapter';
import {RequestBuilder} from './core/http/request/request-builder';
import {AuthService} from './modules/auth/authorization';
import {IHttpClient} from './core/http/http-client.interface';
import {EncryptionService} from './core/encryption/encryption';
import {AuthorizationDto} from './modules/auth/dto/authorization.dto';
import {CreateOrderService} from './modules/payment/create-order';
import {OrderResponseDto} from './modules/payment/dto/order-response.dto';
import {OrderRequestDto} from './modules/payment/dto/order-request.dto';
import {GenerateRequestIdentification} from './core/utils/request-identification';
import {RetryHttpClient} from './core/http/retry-http-client';
import {RefundResponseDto} from './modules/refund/dto/refund-response.dto';
import {CreateRefundService} from './modules/refund/create-refund';
import {RefundRequestDto} from './modules/refund/dto/refund-request.dto';
import {DateTimeProvider} from './core/utils/date-time.provider';
import {CallbackDto} from './modules/callback/dto/callback.dto';
import {CallbackHandler} from "./modules/callback/process-callback";
import {OrderDataResponseDto} from "./modules/payment/dto/order-data-response";
import {CheckOrderService} from "./modules/payment/check-order";

export interface AllianceSDKConfig {
    authentificationData: AuthorizationDto;
    httpClient?: IHttpClient;
    onTokenUpdate?: (data: AuthorizationDto) => void | Promise<void>;
}

export class AllianceBankClient {
    private config: AllianceSDKConfig;
    public readonly auth: AuthService;
    public readonly encryption: EncryptionService;
    private readonly http: IHttpClient;
    private readonly requestBuilder: RequestBuilder;
    private createOrderService: CreateOrderService;
    private createRefundService: CreateRefundService;
    private callbackHandler: CallbackHandler;
    private checkOrderService: CheckOrderService;

    constructor(config: AllianceSDKConfig) {
        this.config = config;
        this.requestBuilder = new RequestBuilder();
        this.encryption = new EncryptionService();
        const baseHttpClient = config.httpClient ?? new FetchAdapter(
            config.authentificationData.baseUrl,
            this.requestBuilder
        );
        this.auth = new AuthService(
            baseHttpClient,
            this.encryption,
            config.onTokenUpdate
        );
        this.http = new RetryHttpClient(baseHttpClient, this.auth);
        this.createOrderService = new CreateOrderService(this.http);
        this.createRefundService = new CreateRefundService(this.http, this.encryption);
        this.callbackHandler = new CallbackHandler();
        this.checkOrderService = new CheckOrderService(this.http);
    }

    public async authorize(): Promise<AuthorizationDto> {
        return await this.auth.authorize(this.config.authentificationData);
    }

    public async createOrder(orderData: object): Promise<OrderResponseDto | object> {
        const updatedAuthDto: AuthorizationDto = await this.auth.authorize(
            this.config.authentificationData
        );

        const updatedOrderData = {
            ...orderData,
            merchantId: updatedAuthDto.merchantId,
            merchantRequestId: GenerateRequestIdentification.generateRequestId()
        };

        const createOrderResponse = await this.createOrderService.createOrder(
            updatedOrderData as OrderRequestDto,
            updatedAuthDto
        );

        return createOrderResponse as OrderResponseDto;
    }

    public async createRefund(refundData: object): Promise<RefundResponseDto> {
        const updatedAuthDto: AuthorizationDto = await this.auth.authorize(
            this.config.authentificationData
        );

        const updatedRefundData = {
            ...refundData,
            merchantId: updatedAuthDto.merchantId,
            merchantRequestId: GenerateRequestIdentification.generateRequestId(),
            date: DateTimeProvider.formattedRefundDate()
        };

        const createRefundResponse = await this.createRefundService.createRefund(
            updatedRefundData as RefundRequestDto,
            updatedAuthDto
        );

        return createRefundResponse as RefundResponseDto;
    }

    public async handleCallback(data: any): Promise<CallbackDto> {
        return this.callbackHandler.handle(data);
    }

    public async checkOrderData(hppOrderId: string): Promise<OrderDataResponseDto> {
        const updatedAuthDto: AuthorizationDto = await this.auth.authorize(
            this.config.authentificationData
        );

        const orderData = await this.checkOrderService.checkOrderData(hppOrderId, updatedAuthDto);

        return orderData as OrderDataResponseDto;
    }
}
