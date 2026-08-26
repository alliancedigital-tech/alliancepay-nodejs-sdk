import {API} from '../../core/constants/api';
import {IHttpClient} from '../../core/http/http-client.interface';
import {CompletionResponseDto, CompletionResponseSchema} from './dto/completion-response.dto';
import {CompletionRequestDto, CompletionRequestSchema} from './dto/create-completion-request.dto';
import {AuthorizationDto} from '../auth/dto/authorization.dto';
import {DtoValidator} from '../../core/validator/dto-validator';
import {ApiErrorHandler} from '../../core/http/error/error-handler';
import {AllianceSdkException, CompletionAmountException, CompletionException} from '../../core/exceptions/base.exception';
import {EncryptionService} from '../../core/encryption/encryption';
import {CoinAmountConverter} from '../../core/utils/coin-amount-converter';

export type CompletionRequestInput = Omit<CompletionRequestDto, 'coinAmount'> & {
    coinAmount?: number;
    sourceAmount?: number;
    conversionRate?: number;
};

export class CreateCompletionService {
    constructor(
        private readonly httpClient: IHttpClient,
        private readonly encryptionService: EncryptionService,
    ) {}

    public async createCompletion(
        completionData: CompletionRequestInput,
        originalCoinAmount: number,
        authDto: AuthorizationDto
    ): Promise<CompletionResponseDto> {

        const {sourceAmount, conversionRate, ...completionRequestData} = completionData;

        const resolvedCompletionData = {
            ...completionRequestData,
            coinAmount: CoinAmountConverter.resolveCoinAmount(completionRequestData.coinAmount, sourceAmount, conversionRate),
        } as CompletionRequestDto;

        const validatedCompletionData = DtoValidator.validate(resolvedCompletionData, CompletionRequestSchema);

        this.validateCompletionAmount(validatedCompletionData.coinAmount, originalCoinAmount);

        try {
            const encryptedRequest = await this.encryptionService.encrypt(
                validatedCompletionData,
                JSON.stringify(authDto.serverPublic)
            );

            const response = await this.httpClient.post<{ jwe: string | any }>(
                API.ENDPOINT_COMPLETION,
                encryptedRequest,
                authDto,
                false
            );

            const decryptedData = await this.encryptionService.decrypt<Partial<CompletionResponseDto>>(
                response.jwe,
                authDto.authenticationKey
            );

            ApiErrorHandler.checkResponse(CompletionException, decryptedData);
            DtoValidator.validate(decryptedData, CompletionResponseSchema);

            return decryptedData as CompletionResponseDto;
        } catch (error) {
            if (error instanceof AllianceSdkException) throw error;
            ApiErrorHandler.handle(CompletionException, error);
        }
    }

    private validateCompletionAmount(completionCoinAmount: number, originalCoinAmount: number): void {
        const deviation = Math.abs(completionCoinAmount - originalCoinAmount) / originalCoinAmount;

        if (deviation > 0.20) {
            throw new CompletionAmountException(
                `completionCoinAmount (${completionCoinAmount}) `
                + `deviates more than 20% from originalCoinAmount (${originalCoinAmount}).`
                + ` Allowed range: ${Math.floor(originalCoinAmount * 0.8)}–${Math.ceil(originalCoinAmount * 1.2)}`,
                'COMPLETION_AMOUNT_OUT_OF_RANGE'
            );
        }
    }
}
