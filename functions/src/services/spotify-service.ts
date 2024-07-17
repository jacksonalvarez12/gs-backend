import {constants} from '../constants';
import {secrets} from '../secrets';
import {LogService} from './log-service';

export class SpotifyService {
    private logger: LogService;

    constructor(logger: LogService) {
        this.logger = logger;
    }

    async requestAccessTokenByAuthCode(
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

        if (!json.access_token || !json.refresh_token) {
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
            refreshToken: json.refresh_token as string,
        };
    }
}
