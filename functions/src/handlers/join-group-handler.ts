import {firestore} from 'firebase-admin';
import {FieldValue} from 'firebase-admin/firestore';
import {paths} from '../constants';
import {DbService} from '../services/db-service';
import {LogService} from '../services/log-service';
import {DefaultRes, JoinGroupReq} from '../types/function-requests';
import {GroupUpdate} from '../types/group';

export class JoinGroupHandler {
    private dbService: DbService;

    constructor(logger: LogService) {
        this.dbService = new DbService(logger);
    }

    async handle(uid: string, data: JoinGroupReq): Promise<DefaultRes> {
        const {groupId} = data;

        // Write user id to group's members
        const groupUpdate: GroupUpdate = {
            members: FieldValue.arrayUnion(uid),
        };

        await this.dbService.update(
            firestore().collection(paths.groupsCollection),
            groupId,
            groupUpdate
        );

        return {};
    }
}
