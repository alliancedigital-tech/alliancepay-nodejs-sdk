import {API} from '../../core/constants/api';
import {IHttpClient} from '../../core/http/http-client.interface';
import {OrderResponseDto, OrderResponseSchema} from './dto/order-response.dto';
import {OrderRequestDto, OrderRequestSchema} from './dto/order-request.dto';
import {AuthorizationDto} from '../auth/dto/authorization.dto';
import {DtoValidator} from '../../core/validator/dto-validator';
import {AllianceSdkException, GeneralApiException, PaymentException} from '../../core/exceptions/base.exception';
import {ApiErrorHandler} from '../../core/http/error/error-handler';
import {ValidationException} from '../../core/exceptions/validation.exception';

export class CreateOrderService {
    private readonly httpClient: IHttpClient;

    constructor(httpClient: IHttpClient) {
        this.httpClient = httpClient;
    }

    public async createOrder(
        orderData: OrderRequestDto,
        authDto: AuthorizationDto
    ): Promise<OrderResponseDto> {

        DtoValidator.validate(orderData, OrderRequestSchema);

        try {
            const response = await this.httpClient.post<string | any >(
                API.ENDPOINT_CREATE_ORDER,
                orderData,
                authDto
            );

            DtoValidator.validate(response, OrderResponseSchema);

            return response as OrderResponseDto;
        } catch (error) {
            if (error instanceof ValidationException) {
                throw error;
            }
            ApiErrorHandler.handle(PaymentException, error);
        }
    }
}
