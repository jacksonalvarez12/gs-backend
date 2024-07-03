import {CollectionReference, Timestamp} from 'firebase-admin/firestore';
import {LogService} from '../log-service/log-service';

export class FirestoreService {
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
