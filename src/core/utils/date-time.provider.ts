export class DateTimeProvider {
    public static formattedRefundDate(date: Date = new Date()): string {
        const isoString = date.toISOString();

        return isoString
            .replace('T', ' ')
            .replace('Z', '+00:00')
            .replace(/\.(\d{2})\d/, '.$1');
    }
}
