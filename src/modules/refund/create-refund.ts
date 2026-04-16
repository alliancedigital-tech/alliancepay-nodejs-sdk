import {API} from '../../core/constants/api';
import {IHttpClient} from '../../core/http/http-client.interface';
import {RefundResponseDto, RefundResponseSchema} from './dto/refund-response.dto';
import {RefundRequestDto, RefundRequestSchema} from './dto/refund-request.dto';
import {AuthorizationDto} from '../auth/dto/authorization.dto';
import {DtoValidator} from '../../core/validator/dto-validator';
import {ApiErrorHandler} from '../../core/http/error/error-handler';
import {AllianceSdkException, RefundException} from '../../core/exceptions/base.exception';
import {EncryptionService} from '../../core/encryption/encryption';

export class CreateRefundService {
    constructor(
        private readonly httpClient: IHttpClient,
        private readonly encryptionService: EncryptionService,
    ) {
        this.httpClient = httpClient;
    }

    public async createRefund(
        orderData: RefundRequestDto,
        authDto: AuthorizationDto
    ): Promise<RefundResponseDto> {

        DtoValidator.validate(orderData, RefundRequestSchema);

        try {
            const encryptedRequest = await this.encryptionService.encrypt(orderData, JSON.stringify(authDto.serverPublic));

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

            return decryptedData as RefundResponseDto;
        } catch (error) {
            if (error instanceof AllianceSdkException) throw error;
            ApiErrorHandler.handle(RefundException, error);
        }
    }
}
