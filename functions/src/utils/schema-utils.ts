import Joi = require('joi');
import {LogService} from '../services/log-service';

export class SchemaUtils {
    private logger: LogService;

    constructor(logger: LogService) {
        this.logger = logger;
    }

    validate<T>(
        fnName: string,
        request: unknown,
        schema: Joi.ObjectSchema<T>
    ): {request: T} | {errorMsg: string} {
        const {error, value} = schema.validate(request);
        if (error) {
            const errorMsg: string = `${fnName} request validation error, schema error: ${JSON.stringify(
                error,
                null,
                2
            )}, schemaValue: ${JSON.stringify(value, null, 2)}`;

            this.logger.error(errorMsg);
            return {errorMsg};
        }

        return {request: value};
    }
}
