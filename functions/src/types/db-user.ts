import {FieldValue, Timestamp} from 'firebase-admin/firestore';

export type DbUser = {
    uid: string;
    displayName: string;
    email: string;
    accessToken?: string;
    tokensLastUpdated?: Timestamp;
    refreshToken?: string;
};

export type DbUserUpdate = {
    accessToken?: string;
    tokensLastUpdated?: FieldValue;
    refreshToken?: string;
};
