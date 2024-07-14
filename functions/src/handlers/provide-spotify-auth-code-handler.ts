import {firestore} from 'firebase-admin';
import {FieldValue} from 'firebase-admin/firestore';
import {paths} from '../constants';
import {DbService} from '../services/db-service';
import {LogService} from '../services/log-service';
import {SpotifyService} from '../services/spotify-service';
import {DbUserAccessTokenUpdate} from '../types/db-user';
import {
    DefaultRes,
    ProvideSpotifyAuthCodeReq,
} from '../types/function-requests';

export class ProvideSpotifyAuthCodeHandler {
    private spotifyService: SpotifyService;
    private dbService: DbService;

    constructor(logger: LogService) {
        this.spotifyService = new SpotifyService(logger);
        this.dbService = new DbService(logger);
    }

    async handle(
        uid: string,
        data: ProvideSpotifyAuthCodeReq
    ): Promise<DefaultRes> {
        const {authCode} = data;

        const rsp:
            | {accessToken: string; refreshToken: string}
            | {errorMsg: string} =
            await this.spotifyService.requestAccessTokenByAuthCode(authCode);

        if ('errorMsg' in rsp) {
            return {errorMsg: rsp.errorMsg};
        }

        // Write to user's doc
        const updateObj: DbUserAccessTokenUpdate = {
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
}
