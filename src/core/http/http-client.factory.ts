import { IHttpClient } from './http-client.interface';
import { RequestBuilder } from './request/request-builder';
import { FetchAdapter } from './adapters/fetch-adapter';

export interface HttpClientOptions {
    baseUrl: string;
    adapter?: IHttpClient;
}

export class HttpClientFactory {
    public static create(options: HttpClientOptions): IHttpClient {
        if (options.adapter) {
            return options.adapter;
        }

        return new FetchAdapter(options.baseUrl, new RequestBuilder());
    }
}
