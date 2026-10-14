import { z } from 'zod';

export const SubscriptionCallbackSchema = z.looseObject({
    hppOrderId: z.string().trim().nonempty(),
    hppPayType: z.string().optional(),
    orderStatus: z.string().optional(),
    recurringTransactionType: z.string().nullable().optional(),
    scheduledPaymentId: z.string().nullable().optional(),
    scheduledPayments: z.unknown().optional(),
    ecomOrderId: z.string().optional(),
    ecomOperationId: z.string().optional(),
    operation: z.looseObject({
        type: z.string().optional(),
        status: z.string().optional(),
        operationId: z.string().optional(),
        coinAmount: z.number().optional(),
        conversionRate: z.number().nullable().optional(),
        receiptUrl: z.string().nullable().optional(),
    }).optional(),
});

export type SubscriptionCallbackData = z.infer<typeof SubscriptionCallbackSchema>;
export type SubscriptionCallbackOperation = NonNullable<SubscriptionCallbackData['operation']>;

export interface AmountReconciliation {
    ok: boolean;
    warning?: string;
}

export class SubscriptionCallbackDTO {
    constructor(
        public readonly data: SubscriptionCallbackData,
        private readonly rawPayload: Record<string, unknown>
    ) {}

    /** Empty/absent recurringTransactionType means the first payment. */
    public isInitialPayment(): boolean {
        const type = this.data.recurringTransactionType;
        return type === undefined || type === null || type === '';
    }

    /** `undefined` when the delivery carries no operation; never throws. */
    public getOperation(): SubscriptionCallbackOperation | undefined {
        return this.data.operation;
    }

    /** Distinguishes "field absent in this delivery" from "field present and null". */
    public has(field: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.rawPayload, field);
    }

    public getRawPayload(): Record<string, unknown> {
        return this.rawPayload;
    }

    /** Best-effort check; a mismatch is reported, never thrown. */
    public reconcileAmount(expectedAmount: number): AmountReconciliation {
        const actual = this.data.operation?.coinAmount;
        if (actual === undefined) {
            return { ok: true, warning: 'Callback has no operation.coinAmount to reconcile.' };
        }
        if (actual !== expectedAmount) {
            return { ok: false, warning: `Amount mismatch: expected ${expectedAmount}, got ${actual}.` };
        }
        return { ok: true };
    }
}
