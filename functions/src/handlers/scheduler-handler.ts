import {firestore} from 'firebase-admin';
import {getAuth} from 'firebase-admin/auth';
import {FieldValue} from 'firebase-admin/firestore';
import {DateTime} from 'luxon';
import {paths} from '../constants';
import {DbService} from '../services/db-service';
import {LogService} from '../services/log-service';
import {SpotifyService} from '../services/spotify-service';
import {DbUser, DbUserUpdate} from '../types/db-user';
import {Group} from '../types/group';

export class SchedulerHandler {
    private logger: LogService;
    private dbService: DbService;
    private spotifyService: SpotifyService;

    constructor(logger: LogService) {
        this.logger = logger;
        this.dbService = new DbService(this.logger);
        this.spotifyService = new SpotifyService(this.logger);
    }

    async handle(): Promise<void> {
        this.logger.info(`Starting scheduler function`);

        // Do these every hour
        await this.refreshAllTokens();

        const currentHour = DateTime.now().setZone('America/New_York').hour;

        if (currentHour === 4) {
            await this.deleteUsersWithoutAuth();
            await this.removeNonexistentMembersFromGroups();
        }

        return;
    }

    private async refreshAllTokens(): Promise<void> {
        this.logger.info('Starting token refresher function');

        let users: DbUser[] = [];
        try {
            users = await this.dbService.readCollection<DbUser>(
                firestore().collection(paths.usersCollection)
            );
        } catch (err) {
            this.logger.error(
                `Error throw while reading users collection in refreshAllTokens, error: ${JSON.stringify(
                    err,
                    null,
                    2
                )}`
            );
        }

        for (const user of users) {
            if (!user.accessToken || !user.refreshToken) {
                this.logger.debug(
                    `User ${user.uid} has no access token or refresh token, skipping...`
                );
                continue;
            }

            try {
                // Refresh user's tokens
                const response: {accessToken: string} | {errorMsg: string} =
                    await this.spotifyService.refreshAccessTokensByRefreshToken(
                        user.refreshToken
                    );

                if ('errorMsg' in response) {
                    continue;
                }

                const updateObj: DbUserUpdate = {
                    accessToken: response.accessToken,
                    tokensLastUpdated: FieldValue.serverTimestamp(),
                };

                await this.dbService.update(
                    firestore().collection(paths.usersCollection),
                    user.uid,
                    updateObj
                );
            } catch (err) {
                this.logger.error(
                    `Error throw while refreshing tokens for user ${
                        user.uid
                    }, error: ${JSON.stringify(err, null, 2)}`
                );

                const updateObj: DbUserUpdate = {
                    accessToken: '',
                    tokensLastUpdated: FieldValue.serverTimestamp(),
                    refreshToken: '',
                };

                try {
                    // Remove user's tokens
                    await this.dbService.update(
                        firestore().collection(paths.usersCollection),
                        user.uid,
                        updateObj
                    );
                } catch (err) {
                    this.logger.error(
                        `Error throw while removing tokens for user ${
                            user.uid
                        }, error: ${JSON.stringify(err, null, 2)}`
                    );
                }
            }
        }
    }

    private async deleteUsersWithoutAuth(): Promise<void> {
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
                        await this.dbService.delete(
                            firestore().collection(paths.usersCollection),
                            user.uid
                        );
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

    private async removeNonexistentMembersFromGroups(): Promise<void> {
        this.logger.info(
            'Starting remove non-existent members from groups function'
        );

        let users: DbUser[] = [];
        try {
            users = await this.dbService.readCollection<DbUser>(
                firestore().collection(paths.usersCollection)
            );
        } catch (err) {
            this.logger.error(
                `Error throw while reading users collection in removeNonexistentMembersFromGroups, error: ${JSON.stringify(
                    err,
                    null,
                    2
                )}`
            );
        }

        let groups: Group[] = [];
        try {
            groups = await this.dbService.readCollection<Group>(
                firestore().collection(paths.groupsCollection)
            );
        } catch (err) {
            this.logger.error(
                `Error throw while reading groups collection in refreshAllTokens, error: ${JSON.stringify(
                    err,
                    null,
                    2
                )}`
            );
        }

        for (const group of groups) {
            const membersToRemove: string[] = group.members.filter(
                mem => !users.some(user => user.uid === mem)
            );

            if (membersToRemove.length > 0) {
                try {
                    await this.dbService.update(
                        firestore().collection(paths.groupsCollection),
                        group.groupId,
                        {
                            members: FieldValue.arrayRemove(...membersToRemove),
                        }
                    );
                } catch (err) {
                    this.logger.error(
                        `Error throw while removing members from group, id: ${
                            group.groupId
                        }, error: ${JSON.stringify(err, null, 2)}`
                    );
                }
            }

            if (
                group.members.length - membersToRemove.length === 0 &&
                group.groupId !== '0520104b-81ec-4753-891a-7b50ab076f1b'
            ) {
                // Remove group if no members
                try {
                    await this.dbService.delete(
                        firestore().collection(paths.groupsCollection),
                        group.groupId
                    );
                } catch (err) {
                    this.logger.error(
                        `Error throw while removing group, id: ${
                            group.groupId
                        }, error: ${JSON.stringify(err, null, 2)}`
                    );
                }
            }
        }
    }
}
