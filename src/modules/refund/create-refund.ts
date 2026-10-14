import {API} from '../../core/constants/api';
import {IHttpClient} from '../../core/http/http-client.interface';
import {RefundResponseDto, RefundResponseSchema} from './dto/refund-response.dto';
import {RefundRequestDto, RefundRequestSchema} from './dto/refund-request.dto';
import {AuthorizationDto} from '../auth/dto/authorization.dto';
import {DtoValidator} from '../../core/validator/dto-validator';
import {ApiErrorHandler} from '../../core/http/error/error-handler';
import {AllianceSdkException, RefundException} from '../../core/exceptions/base.exception';
import {CoinAmountConverter} from '../../core/utils/coin-amount-converter';

export type RefundRequestInput = Omit<RefundRequestDto, 'coinAmount'> & {
    coinAmount?: number;
    sourceAmount?: number;
    conversionRate?: number;
};

export class CreateRefundService {
    constructor(
        private readonly httpClient: IHttpClient,
    ) {
        this.httpClient = httpClient;
    }

    public async createRefund(
        orderData: RefundRequestInput,
        authDto: AuthorizationDto
    ): Promise<RefundResponseDto> {

        const {sourceAmount, conversionRate, ...refundData} = orderData;

        const resolvedRefundData = {
            ...refundData,
            coinAmount: CoinAmountConverter.resolveCoinAmount(refundData.coinAmount, sourceAmount, conversionRate),
        } as RefundRequestDto;

        const validatedRefundData = DtoValidator.validate(resolvedRefundData, RefundRequestSchema);

        try {
            const response = await this.httpClient.post<Partial<RefundResponseDto>>(
                API.ENDPOINT_REFUND,
                validatedRefundData,
                authDto
            );

            ApiErrorHandler.checkResponse(RefundException, response);
            DtoValidator.validate(response, RefundResponseSchema);

            return response as RefundResponseDto;
        } catch (error) {
            if (error instanceof AllianceSdkException) throw error;
            ApiErrorHandler.handle(RefundException, error);
        }
    }
}
