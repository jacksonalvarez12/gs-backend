import {FieldValue, Timestamp} from 'firebase-admin/firestore';

export type DbUser = {
    uid: string;
    displayName: string;
    email: string;
    accessToken?: string;
    tokensLastUpdated?: Timestamp;
    refreshToken?: string;
};

export type DbUserAccessTokenUpdate = {
    accessToken: string;
    tokensLastUpdated: FieldValue;
    refreshToken: string;
};
