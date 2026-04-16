export const API = {
    REQUEST_CONTENT_TYPE_TEXT: 'text/plain',
    REQUEST_CONTENT_TYPE_JSON: 'application/json',
    X_API_VERSION: 'V1',
    ENDPOINT_CREATE_ORDER: '/ecom/execute_request/hpp/v1/create-order',
    ENDPOINT_OPERATIONS: '/ecom/execute_request/hpp/v1/operations',
    ENDPOINT_REFUND: '/ecom/execute_request/payments/v3/refund',
    ENDPOINT_AUTHORIZE: '/api-gateway/authorize_virtual_device',
} as const;

export enum OPERATION_TYPES {
    PURCHASE = 'PURCHASE',
    REFUND = 'REFUND'
};
