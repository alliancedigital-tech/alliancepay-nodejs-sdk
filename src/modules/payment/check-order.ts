import {IHttpClient} from '../../core/http/http-client.interface';
import {AuthorizationDto} from '../auth/dto/authorization.dto';
import {DtoValidator} from '../../core/validator/dto-validator';
import {API} from '../../core/constants/api';
import {AllianceSdkException, GeneralApiException} from '../../core/exceptions/base.exception';
import {ApiErrorHandler} from '../../core/http/error/error-handler';
import {OrderDataResponseDto, OrderDataResponseSchema} from './dto/order-data-response';

export class CheckOrderService {
    private readonly httpClient: IHttpClient;

    constructor(httpClient: IHttpClient) {
        this.httpClient = httpClient;
    }

    public async checkOrderData(
        hppOrderId: string,
        authDto: AuthorizationDto
    ): Promise<OrderDataResponseDto> {

        try {
            const response = await this.httpClient.post<string | any>(
                API.ENDPOINT_OPERATIONS,
                {hppOrderId: hppOrderId},
                authDto
            );

            DtoValidator.validate(response, OrderDataResponseSchema);

            return response as OrderDataResponseDto;
        } catch (error) {
            if (error instanceof AllianceSdkException) {
                throw error;
            }
            if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationException') {
                throw error;
            }
            ApiErrorHandler.handle(GeneralApiException, error);
        }
    }
}
