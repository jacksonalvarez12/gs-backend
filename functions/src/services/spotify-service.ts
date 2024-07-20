import {firestore} from 'firebase-admin';
import {FieldValue} from 'firebase-admin/firestore';
import {DateTime} from 'luxon';
import {constants, paths} from '../constants';
import {secrets} from '../secrets';
import {DbUserUpdate} from '../types/db';
import {DefaultRes} from '../types/function-requests';
import {SpotifyTrack, SpotifyTrackStream} from '../types/spotify';
import {DbService} from './db-service';
import {LogService} from './log-service';

export class SpotifyService {
    private logger: LogService;
    private dbService: DbService;

    constructor(logger: LogService) {
        this.logger = logger;
        this.dbService = new DbService(this.logger);
    }

    async provideSpotifyAuthCode(
        uid: string,
        authCode: string
    ): Promise<DefaultRes> {
        const rsp:
            | {accessToken: string; refreshToken: string}
            | {errorMsg: string} = await this.requestAccessTokenByAuthCode(
            authCode
        );

        if ('errorMsg' in rsp) {
            return {errorMsg: rsp.errorMsg};
        }

        // Write to user's doc
        const updateObj: DbUserUpdate = {
            accessToken: rsp.accessToken,
            refreshToken: rsp.refreshToken,
            tokensLastUpdated: FieldValue.serverTimestamp(),
        };

        await this.dbService.update(
            firestore().collection(paths.usersCollection),
            uid,
            updateObj
        );

        return {};
    }

    private async requestAccessTokenByAuthCode(
        authCode: string
    ): Promise<
        {accessToken: string; refreshToken: string} | {errorMsg: string}
    > {
        // Get access and refresh token from spotify
        const headers: Record<string, string> = {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization:
                'Basic ' +
                Buffer.from(
                    constants.spotifyClientId +
                        ':' +
                        secrets.spotifyClientSecret
                ).toString('base64'),
        };

        const body: Record<string, string> = {
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: constants.redirectUrl,
        };

        const rsp: Response = await fetch(
            'https://accounts.spotify.com/api/token',
            {
                headers,
                body: new URLSearchParams(body),
                method: 'POST',
            }
        );

        const json: Record<string, unknown> = await rsp.json();

        if (!json.access_token || !json.refresh_token) {
            const errorMsg: string = `Spotify request access token by auth code missing access_token or refresh_token: ${JSON.stringify(
                json,
                null,
                2
            )}`;

            this.logger.error(errorMsg);
            return {errorMsg};
        }

        return {
            accessToken: json.access_token as string,
            refreshToken: json.refresh_token as string,
        };
    }

    async refreshAccessTokensByRefreshToken(
        refreshToken: string
    ): Promise<{accessToken: string} | {errorMsg: string}> {
        // Get access and refresh token from spotify
        const headers: Record<string, string> = {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization:
                'Basic ' +
                Buffer.from(
                    constants.spotifyClientId +
                        ':' +
                        secrets.spotifyClientSecret
                ).toString('base64'),
        };

        const body: Record<string, string> = {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        };

        const rsp: Response = await fetch(
            'https://accounts.spotify.com/api/token',
            {
                headers,
                body: new URLSearchParams(body),
                method: 'POST',
            }
        );

        const json: Record<string, unknown> = await rsp.json();

        if (!json.access_token) {
            const errorMsg: string = `Spotify request access token by refresh token missing access_token or refresh_token: ${JSON.stringify(
                json,
                null,
                2
            )}`;

            this.logger.error(errorMsg);
            return {errorMsg};
        }

        return {
            accessToken: json.access_token as string,
        };
    }

    async getTracksPlayedInTheLastHour(
        userId: string,
        accessToken: string,
        hour: number
    ): Promise<SpotifyTrackStream[]> {
        const headers: Record<string, string> = {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${accessToken}`,
        };

        // Get timestamp of now and an hour ago.
        const midnight: number = DateTime.now()
            .setZone(constants.timezone)
            .startOf('day')
            .toMillis();

        const now: number = midnight + hour * 60 * 60 * 1000;
        const anHourAgo: number = now - 60 * 60 * 1000;

        const body: Record<string, string> = {
            limit: '50',
        };

        const rsp: Response = await fetch(
            'https://api.spotify.com/v1/me/player/recently-played',
            {
                headers,
                body: new URLSearchParams(body),
                method: 'POST',
            }
        );

        const json: Record<string, unknown> = await rsp.json();

        const trackStreams: SpotifyTrackStream[] = (
            json.items as Record<string, unknown>[]
        ).flatMap((item: Record<string, unknown>) => {
            const spotTrack: Record<string, unknown> = item.track as Record<
                string,
                unknown
            >;
            const spotAlbum: Record<string, unknown> =
                spotTrack.album as Record<string, unknown>;
            const spotArtists: Record<string, unknown>[] =
                spotAlbum.artists as Record<string, unknown>[];

            const track: SpotifyTrack = {
                trackId: spotTrack.id as string,
                name: spotTrack.name as string,
                popularity: spotTrack.popularity as number,
                duration: spotTrack.duration_ms as number,
                explicit: spotTrack.explicit as boolean,
                url: (spotTrack.external_urls as Record<string, string>)
                    .spotify as string,
                albumId: spotAlbum.id as string,
                albumName: spotAlbum.name as string,
                artists: spotArtists.flatMap(artist => ({
                    artistId: artist.id as string,
                    artistName: artist.name as string,
                })),
            };

            const stream: SpotifyTrackStream = {
                userId,
                isoTimestamp:
                    DateTime.fromISO(item.played_at as string)
                        .setZone(constants.timezone)
                        .toISO() ?? '',
                ...track,
            };

            return stream;
        });

        return trackStreams.filter(stream => {
            const timestampMs: number = DateTime.fromISO(
                stream.isoTimestamp
            ).toMillis();

            return timestampMs >= anHourAgo && timestampMs <= now;
        });
    }
}
