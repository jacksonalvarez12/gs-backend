import {firestore} from 'firebase-admin';
import {DateTime} from 'luxon';
import {constants, paths} from '../constants';
import {DbUser, HourlyScrape} from '../types/db';
import {SpotifyTrackStream} from '../types/spotify';
import {ErrorUtils} from '../utils/error-utils';
import {DbService} from './db-service';
import {LogService} from './log-service';
import {SpotifyService} from './spotify-service';

export class DataScrapingService {
    logger: LogService;
    dbService: DbService;
    spotifyService: SpotifyService;

    constructor(logger: LogService) {
        this.logger = logger;
        this.dbService = new DbService(this.logger);
        this.spotifyService = new SpotifyService(this.logger);
    }

    async scrapeMultipleUsersData(
        users: DbUser[],
        currentHour: number
    ): Promise<void> {
        for (const user of users) {
            await this.scrapeRecentData(user, currentHour);
        }
    }

    async scrapeRecentData(user: DbUser, hour: number): Promise<void> {
        try {
            this.logger.debug(
                `Scraping recent data for user ${user.uid} at hour ${hour}...`
            );

            // Assume user's token is up to date
            const recentStreams: SpotifyTrackStream[] =
                await this.spotifyService.getTracksPlayedInTheLastHour(
                    user.uid,
                    user.accessToken as string,
                    hour
                );

            this.logger.info(
                `Scraped ${recentStreams.length} tracks for user ${user.uid} at hour ${hour}`
            );
            if (recentStreams.length > 0) {
                const doc: HourlyScrape = {
                    streams: recentStreams,
                    date: DateTime.now()
                        .setZone(constants.timezone)
                        .toISODate() as string,
                    hour: hour,
                    userId: user.uid,
                };

                await this.dbService.set(
                    firestore()
                        .collection(paths.usersCollection)
                        .doc(user.uid)
                        .collection(paths.hourlyScrapesSubcollection),
                    false,
                    doc
                );

                this.logger.debug(`Uploaded scraped data for user ${user.uid}`);
            }
        } catch (err) {
            this.logger.error(
                `Unexpected error in scrapeRecentData function for user ${
                    user.uid
                } ${ErrorUtils.dsc(err)}`
            );
        }
    }
}
