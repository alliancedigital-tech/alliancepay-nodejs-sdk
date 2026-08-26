import {API} from '../../core/constants/api';
import {IHttpClient} from '../../core/http/http-client.interface';
import {RefundResponseDto, RefundResponseSchema} from './dto/refund-response.dto';
import {RefundRequestDto, RefundRequestSchema} from './dto/refund-request.dto';
import {AuthorizationDto} from '../auth/dto/authorization.dto';
import {DtoValidator} from '../../core/validator/dto-validator';
import {ApiErrorHandler} from '../../core/http/error/error-handler';
import {AllianceSdkException, RefundException} from '../../core/exceptions/base.exception';
import {EncryptionService} from '../../core/encryption/encryption';
import {CoinAmountConverter} from '../../core/utils/coin-amount-converter';

export type RefundRequestInput = Omit<RefundRequestDto, 'coinAmount'> & {
    coinAmount?: number;
    sourceAmount?: number;
    conversionRate?: number;
};

export class CreateRefundService {
    constructor(
        private readonly httpClient: IHttpClient,
        private readonly encryptionService: EncryptionService,
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
            const encryptedRequest = await this.encryptionService.encrypt(validatedRefundData, JSON.stringify(authDto.serverPublic));

            const response = await this.httpClient.post<{ jwe: string | any }>(
                API.ENDPOINT_REFUND,
                encryptedRequest,
                authDto,
                false
            );

            const decryptedData = await this.encryptionService.decrypt<Partial<RefundResponseDto>>(
                response.jwe,
                authDto.authenticationKey
            );

            ApiErrorHandler.checkResponse(RefundException, decryptedData);
            DtoValidator.validate(decryptedData, RefundResponseSchema);

            return decryptedData as RefundResponseDto;
        } catch (error) {
            if (error instanceof AllianceSdkException) throw error;
            ApiErrorHandler.handle(RefundException, error);
        }
    }
}
