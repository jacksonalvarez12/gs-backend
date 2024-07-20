import {initializeApp} from 'firebase-admin/app';
import {user} from 'firebase-functions/v1/auth';
import {CallableOptions, onCall} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {GroupService} from './services/group-service';
import {LogService} from './services/log-service';
import {SchedulerService} from './services/scheduler-service';
import {SpotifyService} from './services/spotify-service';
import {UserService} from './services/user-service';
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

            return await new UserService(logger).createAccount(
                auth.uid,
                rsp.request.email,
                rsp.request.displayName
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

            return await new UserService(logger).deleteAccount(auth.uid);
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

        return await new UserService(logger).deleteAccount(user.uid);
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

            return await new GroupService(logger).joinGroup(
                auth.uid,
                rsp.request.groupId
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

            return await new GroupService(logger).leaveGroup(
                auth.uid,
                rsp.request.groupId
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

            return await new SpotifyService(logger).provideSpotifyAuthCode(
                auth.uid,
                rsp.request.authCode
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

            return await new SchedulerService(logger).hourly();
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
