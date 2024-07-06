import {debug, error, info} from 'firebase-functions/logger';

export class LogService {
    private fn: string;
    uid: string;

    constructor(fn: string, uid?: string) {
        this.fn = fn;
        this.uid = uid ?? '';
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
        return `[${this.fn}]${this.uid ? ` (${this.uid})` : ''} ${message}`;
    }
}
