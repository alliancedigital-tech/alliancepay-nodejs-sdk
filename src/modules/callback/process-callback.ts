import { DtoValidator } from '../../core/validator/dto-validator';
import {
    CallbackDto,
    CallbackSchema
} from './dto/callback.dto';
import { ValidationException } from '../../core/exceptions/validation.exception';
import {OPERATION_TYPES} from '../../core/constants/api';

export class CallbackHandler {
    public handle(rawData: any): CallbackDto {
        DtoValidator.validate(rawData, CallbackSchema);

        const callback = rawData as CallbackDto;

        this.validateOperationType(callback.operation);

        return callback;
    }

    private validateOperationType(operation: any): void {
        const validTypes = [
            OPERATION_TYPES.PURCHASE,
            OPERATION_TYPES.REFUND
        ];

        if (!operation.type || !validTypes.includes(operation.type)) {
            throw new ValidationException([
                `Unknown or missing operation type: ${operation.type}`
            ]);
        }
    }
}
