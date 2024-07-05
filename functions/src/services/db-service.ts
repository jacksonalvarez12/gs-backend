import {CollectionReference, Timestamp} from 'firebase-admin/firestore';
import {LogService} from './log-service';

export class DbService {
    private logger: LogService;

    constructor(logger: LogService) {
        this.logger = logger;
    }

    async set(
        collection: CollectionReference,
        documentId: string,
        data: Record<string, unknown>
    ): Promise<void> {
        await collection
            .doc(documentId)
            .set({...data, created: Timestamp.now()});

        this.logger.debug(
            `Set document ${documentId} in collection ${
                collection.path
            } with data; data: ${JSON.stringify(data, null, 2)}`
        );
    }

    async read<T>(
        collection: CollectionReference,
        documentId: string,
        includeTimestamps?: boolean
    ): Promise<T> {
        const rst: FirebaseFirestore.DocumentSnapshot<
            FirebaseFirestore.DocumentData,
            FirebaseFirestore.DocumentData
        > = await collection.doc(documentId).get();

        const data: T = rst.data() as T;

        if (!includeTimestamps) {
            if ((data as Record<string, unknown>)['created']) {
                delete (data as Record<string, unknown>)['created'];
            }
            if ((data as Record<string, unknown>)['lastUpdated']) {
                delete (data as Record<string, unknown>)['lastUpdated'];
            }
        }

        this.logger.debug(
            `Read document ${documentId} in collection ${
                collection.path
            }, document data: ${JSON.stringify(data, null, 2)}`
        );

        return data;
    }

    async delete(
        collection: CollectionReference,
        documentId: string
    ): Promise<void> {
        await collection.doc(documentId).delete();

        this.logger.debug(
            `Deleted document ${documentId} in collection ${collection.path}`
        );
    }
}
