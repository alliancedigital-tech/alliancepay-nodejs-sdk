export class DateTimeProvider {
    public static formattedRefundDate(date: Date = new Date()): string {
        const isoString = date.toISOString();

        return isoString
            .replace('T', ' ')
            .replace('Z', '+00:00')
            .replace(/\.(\d{2})\d/, '.$1');
    }

    public static formattedPreAuthExpDate(): string {
        const expDate = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 1000);
        return DateTimeProvider.formattedRefundDate(expDate);
    }
}
