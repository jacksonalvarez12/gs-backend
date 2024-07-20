export type SpotifyTrack = {
    trackId: string;
    name: string;
    popularity: number;
    duration: number;
    explicit: boolean;
    url: string;
    albumId: string;
    albumName: string;
    artists: {artistId: string; artistName: string}[];
};

export type SpotifyTrackStream = SpotifyTrack & {
    userId: string;
    isoTimestamp: string;
};
