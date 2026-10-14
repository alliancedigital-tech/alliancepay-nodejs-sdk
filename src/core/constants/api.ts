export const API = {
    REQUEST_CONTENT_TYPE_JSON: 'application/json',
    REQUEST_CONTENT_TYPE_JWS: 'application/jws',
    X_API_VERSION: 'V1',
    ENDPOINT_CREATE_ORDER: '/ecom/jws/payments/hpp/create_order_v1',
    ENDPOINT_OPERATIONS: '/ecom/jws/payments/hpp/operations_v1',
    ENDPOINT_REFUND: '/ecom/jws/payments/refund_v1',
    ENDPOINT_COMPLETION: '/ecom/jws/payments/preauth/completion_v1',
    ENDPOINT_PLAN_CREATE: '/ecom/jws/scheduled_payments/plan/create_v1',
    ENDPOINT_PLAN_UPDATE: '/ecom/jws/scheduled_payments/plan/update_v1',
    ENDPOINT_PLAN_STATUS_UPDATE: '/ecom/jws/scheduled_payments/plan/status_update_v1',
    ENDPOINT_PLAN_VERSION_UPDATE: '/ecom/jws/scheduled_payments/plan/version/update_v1',
    ENDPOINT_PLAN_VERSION_DELETE: '/ecom/jws/scheduled_payments/plan/version/delete_v1',
    ENDPOINT_PLAN_GET: '/ecom/jws/scheduled_payments/plan/get_v1',
    ENDPOINT_PLAN_SEARCH: '/ecom/jws/scheduled_payments/plan/search_v1',
    ENDPOINT_SUBSCRIPTION_ORDER_CREATE: '/ecom/jws/scheduled_payments/subscription-orders/create_v1',
    ENDPOINT_SUBSCRIPTION_ORDER_CANCEL: '/ecom/jws/scheduled_payments/subscription-orders/cancel_v1',
    ENDPOINT_RECURRING_PAYMENT_TRIGGER: '/ecom/jws/scheduled_payments/payments/recurring_subscription_v1',
    ENDPOINT_PUBLIC_KEY: '/ecom/keys/public_key/get_v1',
} as const;

export enum OPERATION_TYPES {
    PURCHASE = 'PURCHASE',
    REFUND = 'REFUND',
    A2A = 'ACCOUNT_2_ACCOUNT',
    PREAUTH = 'PREAUTH',
    COMPLETION = 'COMPLETION',
};

export enum HPP_PAY_TYPES {
    PURCHASE = 'PURCHASE',
    A2A = 'A2A',
    PREAUTH = 'PREAUTH',
    COMPLETION = 'COMPLETION',
};

export const CURRENCY_CODES = {
    UAH: 980,
    USD: 840,
    EUR: 978,
} as const;

export const SUPPORTED_CURRENCY_CODES = [
    CURRENCY_CODES.UAH,
    CURRENCY_CODES.USD,
    CURRENCY_CODES.EUR,
] as const;

export const SUBSCRIPTION_CURRENCY = '980' as const;

export enum PLAN_STATUS {
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    ARCHIVED = 'ARCHIVED',
}

export enum INTERVAL_UNIT {
    DAY = 'DAY',
    WEEK = 'WEEK',
    MONTH = 'MONTH',
}
