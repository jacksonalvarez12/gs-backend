import {initializeApp} from 'firebase-admin/app';
import {user} from 'firebase-functions/v1/auth';
import {onCall} from 'firebase-functions/v2/https';
import {CreateAccountHandler} from './handlers/create-account-handler';
import {DeleteAccountHandler} from './handlers/delete-account-handler';
import {JoinGroupHandler} from './handlers/join-group-handler';
import {LeaveGroupHandler} from './handlers/leave-group-handler';
import {LogService} from './services/log-service';
import {
    CreateAccountReq,
    CreateAccountRes,
    DefaultRes,
    JoinGroupReq,
    LeaveGroupReq,
    createAccountReqSchema,
    joinGroupReqSchema,
    leaveGroupReqSchema,
} from './types/function-requests';
import {SchemaUtils} from './utils/schema-utils';

initializeApp();

export const createAccount = onCall(
    {memory: '256MiB', timeoutSeconds: 30},
    async ({auth, data}): Promise<CreateAccountRes> => {
        const fnName: string = 'createAccount';
        try {
            const logger: LogService = new LogService(fnName);
            logger.info(`Starting ${fnName} function`);

            if (!auth) {
                const errorMsg: string = `No auth object in ${fnName}`;

                logger.error(errorMsg);
                return {errorMsg};
            }
            logger.uid = auth.uid;

            const rsp: {request: CreateAccountReq} | {errorMsg: string} =
                new SchemaUtils(logger).validate<CreateAccountReq>(
                    fnName,
                    data,
                    createAccountReqSchema
                );
            if ('errorMsg' in rsp) {
                return rsp;
            }

            return new CreateAccountHandler(logger).handle(
                auth.uid,
                rsp.request
            );
        } catch (err) {
            return {
                errorMsg: `Unexpected error in ${fnName} function, error: ${JSON.stringify(
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
        const fnName: string = 'deleteAccount';
        try {
            const logger: LogService = new LogService(fnName);
            logger.info(`Starting ${fnName} function`);

            if (!auth) {
                const errorMsg: string = `No auth object in ${fnName}`;

                logger.error(errorMsg);
                return {errorMsg};
            }
            logger.uid = auth.uid;

            return new DeleteAccountHandler(logger).handle(auth.uid);
        } catch (err) {
            return {
                errorMsg: `Unexpected error in ${fnName} function, error: ${JSON.stringify(
                    err,
                    null,
                    2
                )}`,
            };
        }
    }
);

export const onAuthDelete = user().onDelete(async user => {
    const fnName: string = 'onAuthDelete';
    try {
        const logger: LogService = new LogService(fnName, user.uid);
        logger.info(`Starting ${fnName} function`);

        return new DeleteAccountHandler(logger).handle(user.uid);
    } catch (err) {
        return {
            errorMsg: `Unexpected error in ${fnName} function, error: ${JSON.stringify(
                err,
                null,
                2
            )}`,
        };
    }
});

export const joinGroup = onCall(
    {memory: '256MiB', timeoutSeconds: 30},
    async ({auth, data}): Promise<DefaultRes> => {
        const fnName: string = 'joinGroup';
        try {
            const logger: LogService = new LogService(fnName);
            logger.info(`Starting ${fnName} function`);

            if (!auth) {
                const errorMsg: string = `No auth object in ${fnName}`;

                logger.error(errorMsg);
                return {errorMsg};
            }
            logger.uid = auth.uid;

            const rsp: {request: JoinGroupReq} | {errorMsg: string} =
                new SchemaUtils(logger).validate<JoinGroupReq>(
                    fnName,
                    data,
                    joinGroupReqSchema
                );
            if ('errorMsg' in rsp) {
                return rsp;
            }

            return new JoinGroupHandler(logger).handle(auth.uid, rsp.request);
        } catch (err) {
            return {
                errorMsg: `Unexpected error in ${fnName} function, error: ${JSON.stringify(
                    err,
                    null,
                    2
                )}`,
            };
        }
    }
);

export const leaveGroup = onCall(
    {memory: '256MiB', timeoutSeconds: 30},
    async ({auth, data}): Promise<DefaultRes> => {
        const fnName: string = 'leaveGroup';
        try {
            const logger: LogService = new LogService(fnName);
            logger.info(`Starting ${fnName} function`);

            if (!auth) {
                const errorMsg: string = `No auth object in ${fnName}`;

                logger.error(errorMsg);
                return {errorMsg};
            }
            logger.uid = auth.uid;

            const rsp: {request: LeaveGroupReq} | {errorMsg: string} =
                new SchemaUtils(logger).validate<LeaveGroupReq>(
                    fnName,
                    data,
                    leaveGroupReqSchema
                );
            if ('errorMsg' in rsp) {
                return rsp;
            }

            return new LeaveGroupHandler(logger).handle(auth.uid, rsp.request);
        } catch (err) {
            return {
                errorMsg: `Unexpected error in ${fnName} function, error: ${JSON.stringify(
                    err,
                    null,
                    2
                )}`,
            };
        }
    }
);
