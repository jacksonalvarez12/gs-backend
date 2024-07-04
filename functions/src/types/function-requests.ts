import Joi = require('joi');
import {DBUser} from './db-user';

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
    user?: DBUser;
    errorMsg?: string;
};
