export const API = {
    REQUEST_CONTENT_TYPE_TEXT: 'text/plain',
    REQUEST_CONTENT_TYPE_JSON: 'application/json',
    X_API_VERSION: 'V1',
    ENDPOINT_CREATE_ORDER: '/ecom/execute_request/hpp/v1/create-order',
    ENDPOINT_OPERATIONS: '/ecom/execute_request/hpp/v1/operations',
    ENDPOINT_REFUND: '/ecom/execute_request/payments/v3/refund',
    ENDPOINT_COMPLETION: '/ecom/execute_request/payments/v1/completion',
    ENDPOINT_AUTHORIZE: '/api-gateway/authorize_virtual_device',
} as const;

export enum OPERATION_TYPES {
    PURCHASE = 'PURCHASE',
    REFUND = 'REFUND',
    A2A = 'ACCOUNT_2_ACCOUNT',
    PREAUTH = 'PREAUTH',
    COMPLETION = 'COMPLETION',
};

export const AUTH_ERROR_CODES: readonly string[] = [
    'b_expired_token',
    'b_auth_token_expired',
    'b_used_token',
    'b_previous_auth_token_expired',
] as const;

export enum HPP_PAY_TYPES {
    PURCHASE = 'PURCHASE',
    A2A = 'A2A',
    PREAUTH = 'PREAUTH',
    COMPLETION = 'COMPLETION',
};
