import {FieldValue, Timestamp} from 'firebase-admin/firestore';
import {SpotifyTrackStream} from './spotify';

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

export type Group = {
    groupId: string;
    groupTitle: string;
    members: string[];
};

export type GroupUpdate = {
    members: FieldValue;
};

export type HourlyScrape = {
    streams: SpotifyTrackStream[];
    date: string;
    hour: number;
    userId: string;
};
