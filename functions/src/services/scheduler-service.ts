import {firestore} from 'firebase-admin';
import {FieldValue} from 'firebase-admin/firestore';
import {DateTime} from 'luxon';
import {constants, paths} from '../constants';
import {DbUser, DbUserUpdate} from '../types/db';
import {DataScrapingService} from './data-scaping-service';
import {DbService} from './db-service';
import {GroupService} from './group-service';
import {LogService} from './log-service';
import {SpotifyService} from './spotify-service';
import {UserService} from './user-service';

export class SchedulerService {
    logger: LogService;
    dbService: DbService;
    userService: UserService;
    groupService: GroupService;
    spotifyService: SpotifyService;
    dataScrapingService: DataScrapingService;

    constructor(logger: LogService) {
        this.logger = logger;
        this.dbService = new DbService(this.logger);
        this.userService = new UserService(this.logger);
        this.groupService = new GroupService(this.logger);
        this.spotifyService = new SpotifyService(this.logger);
        this.dataScrapingService = new DataScrapingService(this.logger);
    }

    async hourly(): Promise<void> {
        this.logger.info(`Starting scheduler function`);
        const currentHour = DateTime.now().setZone(constants.timezone).hour;

        // Do these every hour
        const tokenRefreshedUsers: DbUser[] = await this.refreshAllTokens();
        await this.dataScrapingService.scrapeMultipleUsersData(
            tokenRefreshedUsers,
            currentHour
        );

        if (currentHour === 4) {
            await this.userService.deleteUsersWithoutAuth();
            await this.groupService.removeNonexistentMembersFromGroups();
        }

        return;
    }

    private async refreshAllTokens(): Promise<DbUser[]> {
        this.logger.info('Starting token refresher function');
        const tokenRefreshedUsers: DbUser[] = [];

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

                tokenRefreshedUsers.push({
                    ...user,
                    accessToken: response.accessToken,
                });

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

        return tokenRefreshedUsers;
    }
}
