import {firestore} from 'firebase-admin';
import {DateTime} from 'luxon';
import {constants, paths} from '../constants';
import {DbUser, HourlyScrape} from '../types/db';
import {SpotifyTrackStream} from '../types/spotify';
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
    ): Promise<unknown> {
        return Promise.allSettled(
            users.flatMap(user => this.scrapeRecentData(user, currentHour))
        );
    }

    async scrapeRecentData(user: DbUser, hour: number): Promise<void> {
        try {
            // Assume user's token is up to date
            const recentStreams: SpotifyTrackStream[] =
                await this.spotifyService.getTracksPlayedInTheLastHour(
                    user.uid,
                    user.accessToken as string,
                    hour
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
            }
        } catch (err) {
            this.logger.error(
                `Unexpected error in scrapeRecentData function for user ${
                    user.uid
                }, error: ${JSON.stringify(err, null, 2)}`
            );
        }
    }
}
