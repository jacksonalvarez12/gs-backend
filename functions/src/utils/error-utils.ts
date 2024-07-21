export class ErrorUtils {
    static dsc(error: unknown): string {
        try {
            const str: string = ` [ERROR] ${JSON.stringify(
                error,
                null,
                2
            )}\n[RAW ERROR] ${error}`;
            return str;
        } catch (err) {
            const str: string = ` [ERROR] ${JSON.stringify(error, null, 2)}`;
            return str;
        }
    }
}
