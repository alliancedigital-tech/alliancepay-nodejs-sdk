export function isCompactJws(raw: unknown): raw is string {
    if (typeof raw !== 'string') return false;

    const trimmed = raw.trim();
    if (!trimmed || /\s/.test(trimmed)) return false;

    return trimmed.split('.').length === 3;
}
