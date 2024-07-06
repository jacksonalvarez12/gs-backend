import Joi = require('joi');
import {DbUser} from './db-user';

export type DefaultRes = {
    errorMsg?: string;
};

export type CreateAccountReq = {
    // uid is in auth obj
    displayName: string;
    email: string;
};

export const createAccountReqSchema = Joi.object({
    displayName: Joi.string().required(),
    email: Joi.string().email().required(),
}).required();

export type CreateAccountRes = {
    user?: DbUser;
    errorMsg?: string;
};

export type JoinGroupReq = {
    groupId: string;
};

export const joinGroupReqSchema = Joi.object({
    groupId: Joi.string().required(),
}).required();

export type LeaveGroupReq = {
    groupId: string;
};

export const leaveGroupReqSchema = Joi.object({
    groupId: Joi.string().required(),
}).required();
