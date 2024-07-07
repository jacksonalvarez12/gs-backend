import {firestore} from 'firebase-admin';
import {paths} from '../constants';
import {DbService} from '../services/db-service';
import {LogService} from '../services/log-service';
import {DefaultRes} from '../types/function-requests';

export class DeleteAccountHandler {
    private dbService: DbService;

    constructor(logger: LogService) {
        this.dbService = new DbService(logger);
    }

    async handle(uid: string): Promise<DefaultRes> {
        // Delete user from firestore
        await this.dbService.delete(
            firestore().collection(paths.usersCollection),
            uid
        );

        return {};
    }
}
