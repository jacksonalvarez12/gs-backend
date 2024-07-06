import {FieldValue} from 'firebase-admin/firestore';

export type Group = {
    groupId: string;
    groupTitle: string;
    members: string[];
};

export type GroupUpdate = {
    members: FieldValue;
};
