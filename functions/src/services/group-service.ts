import {firestore} from 'firebase-admin';
import {FieldValue} from 'firebase-admin/firestore';
import {paths} from '../constants';
import {DbUser, Group, GroupUpdate} from '../types/db';
import {DefaultRes} from '../types/function-requests';
import {DbService} from './db-service';
import {LogService} from './log-service';

export class GroupService {
    logger: LogService;
    dbService: DbService;

    constructor(logger: LogService) {
        this.logger = logger;
        this.dbService = new DbService(this.logger);
    }

    async joinGroup(uid: string, groupId: string): Promise<DefaultRes> {
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

    async leaveGroup(uid: string, groupId: string): Promise<DefaultRes> {
        // Remove user id from group's members
        const groupUpdate: GroupUpdate = {
            members: FieldValue.arrayRemove(uid),
        };

        await this.dbService.update(
            firestore().collection(paths.groupsCollection),
            groupId,
            groupUpdate
        );

        return {};
    }

    async removeNonexistentMembersFromGroups(): Promise<void> {
        this.logger.info(
            'Starting remove non-existent members from groups function'
        );

        let users: DbUser[] = [];
        try {
            users = await this.dbService.readCollection<DbUser>(
                firestore().collection(paths.usersCollection)
            );
        } catch (err) {
            this.logger.error(
                `Error throw while reading users collection in removeNonexistentMembersFromGroups, error: ${JSON.stringify(
                    err,
                    null,
                    2
                )}`
            );
        }

        let groups: Group[] = [];
        try {
            groups = await this.dbService.readCollection<Group>(
                firestore().collection(paths.groupsCollection)
            );
        } catch (err) {
            this.logger.error(
                `Error throw while reading groups collection in refreshAllTokens, error: ${JSON.stringify(
                    err,
                    null,
                    2
                )}`
            );
        }

        for (const group of groups) {
            const membersToRemove: string[] = group.members.filter(
                mem => !users.some(user => user.uid === mem)
            );

            if (membersToRemove.length > 0) {
                try {
                    await this.dbService.update(
                        firestore().collection(paths.groupsCollection),
                        group.groupId,
                        {
                            members: FieldValue.arrayRemove(...membersToRemove),
                        }
                    );
                } catch (err) {
                    this.logger.error(
                        `Error throw while removing members from group, id: ${
                            group.groupId
                        }, error: ${JSON.stringify(err, null, 2)}`
                    );
                }
            }

            if (
                group.members.length - membersToRemove.length === 0 &&
                group.groupId !== '0520104b-81ec-4753-891a-7b50ab076f1b'
            ) {
                // Remove group if no members
                try {
                    await this.dbService.delete(
                        firestore().collection(paths.groupsCollection),
                        group.groupId
                    );
                } catch (err) {
                    this.logger.error(
                        `Error throw while removing group, id: ${
                            group.groupId
                        }, error: ${JSON.stringify(err, null, 2)}`
                    );
                }
            }
        }
    }
}
