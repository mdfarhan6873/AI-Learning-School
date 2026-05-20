import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .required(),

    PORT: Joi.number().default(4000),

    DATABASE_URL: Joi.string().required(),

    UPSTASH_REDIS_REST_URL: Joi.string().required(),
    UPSTASH_REDIS_REST_TOKEN: Joi.string().required(),

    JWT_ACCESS_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),

    JWT_ACCESS_EXPIRES: Joi.string().required(),
    JWT_REFRESH_EXPIRES: Joi.string().required(),
});