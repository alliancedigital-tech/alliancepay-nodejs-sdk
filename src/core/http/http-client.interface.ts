import {AuthorizationDto} from '../../modules/auth/dto/authorization.dto';

export interface IHttpClient {
    post<T>(url: string, data: any, auth: AuthorizationDto, isJson?: boolean): Promise<T>;
    get<T>(url: string, data: any, auth: AuthorizationDto): Promise<T>;
}

export interface RequestConfig {
    headers: Record<string, string>;
    data?: any;
}
