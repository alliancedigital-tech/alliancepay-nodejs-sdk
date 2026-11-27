import { parseBankDate } from '../subscription/dto/plan-response.dto';
import { FISCALIZATION_STATUS } from './fiscalization.constants';

export interface FiscalizationStateSnapshot {
    status?: string | null;
    fiscalizationModificationDateTime?: string | null;
    modificationDateTime?: string | null;
}

function modifiedAt(state: FiscalizationStateSnapshot): number | null {
    const raw = state.fiscalizationModificationDateTime ?? state.modificationDateTime;
    if (!raw) return null;
    const time = parseBankDate(raw).getTime();
    return Number.isNaN(time) ? null : time;
}

/**
 * Idempotency rule for callbacks / repeated status refreshes:
 * - an incoming PENDING never overwrites an already known final status;
 * - a final SUCCESS is never overwritten by another status;
 * - data older than what is stored (by modification time) is ignored.
 */
export function shouldApplyFiscalizationUpdate(
    current: FiscalizationStateSnapshot | null | undefined,
    incoming: FiscalizationStateSnapshot
): boolean {
    if (!current || !current.status) return true;

    const currentStatus = current.status;
    const incomingStatus = incoming.status ?? '';

    if (currentStatus === FISCALIZATION_STATUS.SUCCESS && incomingStatus !== FISCALIZATION_STATUS.SUCCESS) return false;
    if (incomingStatus === FISCALIZATION_STATUS.PENDING && currentStatus !== FISCALIZATION_STATUS.PENDING) return false;

    const currentTime = modifiedAt(current);
    const incomingTime = modifiedAt(incoming);
    if (currentTime !== null && incomingTime !== null && incomingTime < currentTime) return false;

    return true;
}
