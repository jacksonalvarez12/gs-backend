import {firestore} from 'firebase-admin';
import {getAuth} from 'firebase-admin/auth';
import {paths} from '../constants';
import {DbUser} from '../types/db';
import {CreateAccountRes, DefaultRes} from '../types/function-requests';
import {DbService} from './db-service';
import {LogService} from './log-service';

export class UserService {
    logger: LogService;
    dbService: DbService;

    constructor(logger: LogService) {
        this.logger = logger;
        this.dbService = new DbService(this.logger);
    }

    async createAccount(
        uid: string,
        email: string,
        displayName: string
    ): Promise<CreateAccountRes> {
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

    async deleteAccount(uid: string): Promise<DefaultRes> {
        // Delete user from firestore
        await this.dbService.delete(
            firestore().collection(paths.usersCollection),
            uid
        );

        return {};
    }

    async deleteUsersWithoutAuth(): Promise<void> {
        this.logger.info('Starting delete users without auth function');

        let users: DbUser[] = [];
        try {
            users = await this.dbService.readCollection<DbUser>(
                firestore().collection(paths.usersCollection)
            );
        } catch (err) {
            this.logger.error(
                `Error throw while reading users collection in deleteUsersWithoutAuth, error: ${JSON.stringify(
                    err,
                    null,
                    2
                )}`
            );
        }

        for (const user of users) {
            try {
                await getAuth().getUser(user.uid);
            } catch (err) {
                if (
                    (err as Record<string, unknown>).code ===
                    'auth/user-not-found'
                ) {
                    try {
                        // User doesn't exist, delete it
                        await this.deleteAccount(user.uid);
                    } catch (err) {
                        this.logger.error(
                            `Error throw while deleting user for having no auth, id: ${
                                user.uid
                            }, error: ${JSON.stringify(err, null, 2)}`
                        );
                    }
                } else {
                    this.logger.error(
                        `Error throw while getting auth for user, id: ${
                            user.uid
                        }, error: ${JSON.stringify(err, null, 2)}`
                    );
                }
            }
        }
    }
}
