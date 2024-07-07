import {firestore} from 'firebase-admin';
import {paths} from '../constants';
import {DbService} from '../services/db-service';
import {LogService} from '../services/log-service';
import {DbUser} from '../types/db-user';
import {CreateAccountReq, CreateAccountRes} from '../types/function-requests';

export class CreateAccountHandler {
    private logger: LogService;
    private dbService: DbService;

    constructor(logger: LogService) {
        this.logger = logger;
        this.dbService = new DbService(logger);
    }

    async handle(
        uid: string,
        data: CreateAccountReq
    ): Promise<CreateAccountRes> {
        const {email, displayName} = data;

        const userCollectionRef: firestore.CollectionReference<
            firestore.DocumentData,
            firestore.DocumentData
        > = firestore().collection(paths.usersCollection);

        try {
            // Check if there's already a user with this uid
            const currentDoc: DbUser = await this.dbService.read<DbUser>(
                userCollectionRef,
                uid
            );

            if (currentDoc) {
                const errorMsg: string = `User with uid ${uid} already exists`;

                this.logger.error(errorMsg);
                return {errorMsg, user: currentDoc};
            }
        } catch (_e) {
            this.logger.debug(
                `No user exists with uid ${uid}, creating new one now...`
            );
        }

        // Write user to firestore
        const user: DbUser = {
            uid,
            displayName,
            email,
        };

        await this.dbService.set(userCollectionRef, uid, user);

        return {user};
    }
}
