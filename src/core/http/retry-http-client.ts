import { IHttpClient } from './http-client.interface';
import { AuthorizationDto } from '../../modules/auth/dto/authorization.dto';
import { AuthService } from '../../modules/auth/authorization';

export class RetryHttpClient implements IHttpClient {
    constructor(
        private readonly decoratedClient: IHttpClient,
        private readonly authService: AuthService
    ) {}

    async post<T>(url: string, data: any, auth: AuthorizationDto, isJson: boolean = true): Promise<T> {
        try {
            return await this.decoratedClient.post<T>(url, data, auth, isJson);
        } catch (error: any) {
            if (this.isUnauthorized(error)) {
                const newAuth = await this.authService.authorize(auth, true);

                return await this.decoratedClient.post<T>(url, data, newAuth, isJson);
            }
            throw error;
        }
    }

    async get<T>(url: string, data: any, auth: AuthorizationDto): Promise<T> {
        try {
            return await this.decoratedClient.get<T>(url, data, auth);
        } catch (error: any) {
            if (this.isUnauthorized(error)) {
                const newAuth = await this.authService.authorize(auth, true);
                return await this.decoratedClient.get<T>(url, data, newAuth);
            }
            throw error;
        }
    }

    private isUnauthorized(error: any): boolean {
        return error.response?.status === 401 || error.statusCode === 401;
    }
}
