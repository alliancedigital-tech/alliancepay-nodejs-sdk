import { IHttpClient } from '../../core/http/http-client.interface';
import { EncryptionService } from '../../core/encryption/encryption';
import { AuthorizationDto, AuthorizationSchema } from './dto/authorization.dto';
import { API } from '../../core/constants/api';
import { DtoValidator } from '../../core/validator/dto-validator';
import { ApiErrorHandler } from '../../core/http/error/error-handler';
import { AuthorizationException, AllianceSdkException } from '../../core/exceptions/base.exception';

export class AuthService {
    constructor(
        private readonly httpClient: IHttpClient,
        private readonly encryptionService: EncryptionService,
        private readonly onTokenUpdate?: (data: AuthorizationDto) => void | Promise<void>
    ) {}

    public async authorize(authDto: AuthorizationDto, reAuth: boolean = false): Promise<AuthorizationDto> {
        DtoValidator.validate(authDto, AuthorizationSchema);

        if (this.isTokenValid(authDto) && !reAuth) {
            return authDto;
        }

        try {
            const response = await this.httpClient.post<any>(
                API.ENDPOINT_AUTHORIZE,
                { serviceCode: authDto.serviceCode },
                authDto
            );

            ApiErrorHandler.checkResponse(AuthorizationException, response);

            const decryptedData = await this.encryptionService.decrypt<Partial<AuthorizationDto>>(
                response.jwe || response.data,
                authDto.authenticationKey
            );

            const updatedAuth: AuthorizationDto = {
                ...authDto,
                ...decryptedData as AuthorizationDto,
                tokenExpirationDateTime: decryptedData.tokenExpirationDateTime
                    ? new Date(decryptedData.tokenExpirationDateTime)
                    : undefined
            };

            if (this.onTokenUpdate) {
                await this.onTokenUpdate(updatedAuth);
            }

            return updatedAuth;

        } catch (error: any) {
            if (error instanceof AllianceSdkException) throw error;
            ApiErrorHandler.handle(AuthorizationException, error);
        }
    }

    public isTokenValid(authDto: AuthorizationDto): boolean {
        if (!authDto.authToken || !authDto.tokenExpirationDateTime) {
            return false;
        }

        const now = new Date();
        const expiration = new Date(authDto.tokenExpirationDateTime);

        return expiration.getTime() > (now.getTime() + 30000);
    }
}
