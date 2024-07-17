import {initializeApp} from 'firebase-admin/app';
import {user} from 'firebase-functions/v1/auth';
import {CallableOptions, onCall} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {CreateAccountHandler} from './handlers/create-account-handler';
import {DeleteAccountHandler} from './handlers/delete-account-handler';
import {JoinGroupHandler} from './handlers/join-group-handler';
import {LeaveGroupHandler} from './handlers/leave-group-handler';
import {ProvideSpotifyAuthCodeHandler} from './handlers/provide-spotify-auth-code-handler';
import {SchedulerHandler} from './handlers/scheduler-handler';
import {LogService} from './services/log-service';
import {
    CreateAccountReq,
    CreateAccountRes,
    DefaultRes,
    JoinGroupReq,
    LeaveGroupReq,
    ProvideSpotifyAuthCodeReq,
    createAccountReqSchema,
    joinGroupReqSchema,
    leaveGroupReqSchema,
    provideSpotifyAuthCodeReqSchema,
} from './types/function-requests';
import {SchemaUtils} from './utils/schema-utils';

initializeApp();

const defaultCallableOptions: CallableOptions = {
    memory: '256MiB',
    timeoutSeconds: 30,
};

export const createAccount = onCall(
    defaultCallableOptions,
    async ({auth, data}): Promise<CreateAccountRes> => {
        const fnName: string = 'createAccount';
        const logger: LogService = new LogService(fnName);
        try {
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

            return await new CreateAccountHandler(logger).handle(
                auth.uid,
                rsp.request
            );
        } catch (err) {
            const errorMsg: string = `Unexpected error in ${fnName} function, error: ${JSON.stringify(
                err,
                null,
                2
            )}`;

            logger.error(errorMsg);
            return {errorMsg};
        }
    }
);

export const deleteAccount = onCall(
    defaultCallableOptions,
    async ({auth}): Promise<DefaultRes> => {
        const fnName: string = 'deleteAccount';
        const logger: LogService = new LogService(fnName);
        try {
            logger.info(`Starting ${fnName} function`);

            if (!auth) {
                const errorMsg: string = `No auth object in ${fnName}`;

                logger.error(errorMsg);
                return {errorMsg};
            }
            logger.uid = auth.uid;

            return await new DeleteAccountHandler(logger).handle(auth.uid);
        } catch (err) {
            const errorMsg: string = `Unexpected error in ${fnName} function, error: ${JSON.stringify(
                err,
                null,
                2
            )}`;

            logger.error(errorMsg);
            return {errorMsg};
        }
    }
);

export const onAuthDelete = user().onDelete(async user => {
    const fnName: string = 'onAuthDelete';
    const logger: LogService = new LogService(fnName, user.uid);
    try {
        logger.info(`Starting ${fnName} function`);

        return await new DeleteAccountHandler(logger).handle(user.uid);
    } catch (err) {
        const errorMsg: string = `Unexpected error in ${fnName} function, error: ${JSON.stringify(
            err,
            null,
            2
        )}`;

        logger.error(errorMsg);
        return {errorMsg};
    }
});

export const joinGroup = onCall(
    defaultCallableOptions,
    async ({auth, data}): Promise<DefaultRes> => {
        const fnName: string = 'joinGroup';
        const logger: LogService = new LogService(fnName);
        try {
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

            return await new JoinGroupHandler(logger).handle(
                auth.uid,
                rsp.request
            );
        } catch (err) {
            const errorMsg: string = `Unexpected error in ${fnName} function, error: ${JSON.stringify(
                err,
                null,
                2
            )}`;

            logger.error(errorMsg);
            return {errorMsg};
        }
    }
);

export const leaveGroup = onCall(
    defaultCallableOptions,
    async ({auth, data}): Promise<DefaultRes> => {
        const fnName: string = 'leaveGroup';
        const logger: LogService = new LogService(fnName);
        try {
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

            return await new LeaveGroupHandler(logger).handle(
                auth.uid,
                rsp.request
            );
        } catch (err) {
            const errorMsg: string = `Unexpected error in ${fnName} function, error: ${JSON.stringify(
                err,
                null,
                2
            )}`;

            logger.error(errorMsg);
            return {errorMsg};
        }
    }
);

export const provideSpotifyAuthCode = onCall(
    defaultCallableOptions,
    async ({auth, data}): Promise<DefaultRes> => {
        const fnName: string = 'provideSpotifyAuthCode';
        const logger: LogService = new LogService(fnName);
        try {
            logger.info(`Starting ${fnName} function`);

            if (!auth) {
                const errorMsg: string = `No auth object in ${fnName}`;

                logger.error(errorMsg);
                return {errorMsg};
            }
            logger.uid = auth.uid;

            const rsp:
                | {request: ProvideSpotifyAuthCodeReq}
                | {errorMsg: string} = new SchemaUtils(
                logger
            ).validate<ProvideSpotifyAuthCodeReq>(
                fnName,
                data,
                provideSpotifyAuthCodeReqSchema
            );
            if ('errorMsg' in rsp) {
                return rsp;
            }

            return await new ProvideSpotifyAuthCodeHandler(logger).handle(
                auth.uid,
                rsp.request
            );
        } catch (err) {
            const errorMsg: string = `Unexpected error in ${fnName} function, error: ${JSON.stringify(
                err,
                null,
                2
            )}`;

            logger.error(errorMsg);
            return {errorMsg};
        }
    }
);

export const scheduler = onSchedule(
    {
        schedule: '0 * * * *',
        memory: defaultCallableOptions.memory,
        timeoutSeconds: 180,
    },
    async () => {
        const fnName: string = 'scheduler';
        const logger: LogService = new LogService(fnName);
        try {
            logger.info(`Starting ${fnName} function`);

            return await new SchedulerHandler(logger).handle();
        } catch (err) {
            logger.error(
                `Unexpected error in ${fnName} function, error: ${JSON.stringify(
                    err,
                    null,
                    2
                )}`
            );
        }
    }
);
