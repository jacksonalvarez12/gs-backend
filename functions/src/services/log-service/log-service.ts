import { debug, error, info } from 'firebase-functions/logger';

export class LogService {
    private fn: string;

    constructor(fn: string) {
        this.fn = fn;
    }

    debug(message: string) {
        debug(this.constructMessage(message));
    }

    info(message: string) {
        info(this.constructMessage(message));
    }

    error(message: string) {
        error(this.constructMessage(message));
    }

    private constructMessage(message: string) {
        return `[${this.fn}] ${message}`;
    }
}
