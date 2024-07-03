import {firestore} from 'firebase-admin';
import {onCall} from 'firebase-functions/v2/https';
import {paths} from './constants';
import {FirestoreService} from './services/firestore-service.ts/firestore-service';
import {LogService} from './services/log-service/log-service';
import {
    CreateAccountReq,
    createAccountReqSchema,
    DefaultRes,
} from './types/function-requests';
import {User} from './types/user';

export const createAccount = onCall(
    {memory: '256MiB', timeoutSeconds: 30},
    async ({auth, data}): Promise<DefaultRes> => {
        try {
            const logger: LogService = new LogService('createAccount');
            logger.info('Starting createAccount function');

            if (!auth) {
                const errorMsg: string = 'No auth object in createAccount';

                logger.error(errorMsg);
                return {errorMsg};
            }

            const {error: schemaError, value: schemaValue} =
                createAccountReqSchema.validate(data);
            if (schemaError) {
                const errorMsg: string = `createAccount request validation error, schema error: ${JSON.stringify(
                    schemaError,
                    null,
                    2
                )}, schemaValue: ${JSON.stringify(schemaValue, null, 2)}`;

                logger.error(errorMsg);
                return {errorMsg};
            }

            const {email, displayName} = schemaValue as CreateAccountReq;
            const uid: string = auth.uid;

            // Write user to firestore
            const user: User = {
                uid,
                displayName,
                email,
            };

            await new FirestoreService(logger).set(
                firestore().collection(paths.userCollection),
                uid,
                user
            );

            return {};
        } catch (err) {
            return {
                errorMsg: `Unexpected error in createAccount function, error: ${JSON.stringify(
                    err,
                    null,
                    2
                )}`,
            };
        }
    }
);

export const deleteAccount = onCall(
    {memory: '256MiB', timeoutSeconds: 30},
    async ({auth}): Promise<DefaultRes> => {
        try {
            const logger: LogService = new LogService('deleteAccount');
            logger.info('Starting deleteAccount function');

            if (!auth) {
                const errorMsg: string = 'No auth object in deleteAccount';

                logger.error(errorMsg);
                return {errorMsg};
            }
            const uid: string = auth.uid;

            // Delete user from firestore
            await new FirestoreService(logger).delete(
                firestore().collection(paths.userCollection),
                uid
            );

            return {};
        } catch (err) {
            return {
                errorMsg: `Unexpected error in deleteAccount function, error: ${JSON.stringify(
                    err,
                    null,
                    2
                )}`,
            };
        }
    }
);
