import { onCall } from 'firebase-functions/v2/https';
import { LogService } from './services/log-service/log-service';

export const helloWorld = onCall(
    { memory: '256MiB', timeoutSeconds: 30 },
    () => {
        const logger: LogService = new LogService('helloWorld');

        logger.info('Hello World!');
        return {
            message: 'Hello World!',
        };
    }
);
