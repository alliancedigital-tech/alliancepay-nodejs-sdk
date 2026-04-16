import { IHttpClient, RequestConfig } from '../http-client.interface';
import { RequestBuilder } from '../request/request-builder';
import { AuthorizationDto } from '../../../modules/auth/dto/authorization.dto';

export class FetchAdapter implements IHttpClient {
    constructor(
        private readonly baseUrl: string,
        private readonly requestBuilder: RequestBuilder
    ) {}

    async post<T>(url: string, data: any, auth: AuthorizationDto, isJson: boolean = true): Promise<T> {
        const config = this.requestBuilder.buildOptionsFromAuthDto(auth, data, isJson);
        const fullUrl = this.buildUrl(url, isJson ? config.data : null);

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: config.headers,
            body: isJson ? JSON.stringify(data) : (config.data as BodyInit)
        });

        return this.handleResponse<T>(response);
    }

    async get<T>(url: string, data: any, auth: AuthorizationDto): Promise<T> {
        const config = this.requestBuilder.buildOptionsFromAuthDto(auth, data);
        const fullUrl = this.buildUrl(url, config.data);

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: config.headers
        });

        return this.handleResponse<T>(response);
    }

    private buildUrl(url: string, params?: any): string {
        const targetUrl = new URL(url, this.baseUrl);

        if (params && typeof params === 'object') {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    targetUrl.searchParams.append(key, String(params[key]));
                }
            });
        }

        return targetUrl.toString();
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorText = await response.text();
            const error = new Error(errorText || `Request failed with status ${response.status}`);
            (error as any).status = response.status;
            throw error;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json() as T;
        }

        return await response.text() as unknown as T;
    }
}
