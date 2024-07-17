import {
    CollectionReference,
    FieldValue,
    Timestamp,
} from 'firebase-admin/firestore';
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
            .set({...data, created: Timestamp.now(), updated: Timestamp.now()});

        this.logger.debug(
            `Set document ${documentId} in collection ${
                collection.path
            } with data: ${JSON.stringify(data, null, 2)}`
        );
    }

    async update(
        collection: CollectionReference,
        documentId: string,
        data: Record<string, unknown>
    ): Promise<void> {
        await collection
            .doc(documentId)
            .update({...data, updated: FieldValue.serverTimestamp()});

        this.logger.debug(
            `Update document ${documentId} in collection ${
                collection.path
            } with update: ${JSON.stringify(data, null, 2)}`
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

    async readCollection<T>(
        collection: CollectionReference,
        includeTimestamps?: boolean
    ): Promise<T[]> {
        const rst: FirebaseFirestore.QuerySnapshot<
            FirebaseFirestore.DocumentData,
            FirebaseFirestore.DocumentData
        > = await collection.get();

        const results: T[] = [];
        for (const doc of rst.docs) {
            const data: T = doc.data() as T;
            if (!includeTimestamps) {
                if ((data as Record<string, unknown>)['created']) {
                    delete (data as Record<string, unknown>)['created'];
                }
                if ((data as Record<string, unknown>)['lastUpdated']) {
                    delete (data as Record<string, unknown>)['lastUpdated'];
                }
            }

            results.push(data);
        }

        this.logger.debug(
            `Read ${rst.docs.length} docs in collection ${collection.path}`
        );

        return results;
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
