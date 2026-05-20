import {
    Controller,
    Get,
    ForbiddenException,
} from '@nestjs/common';

import { RedisService } from '../common/redis/redis.service';

@Controller('health')
export class HealthController {
    constructor(
        private readonly redisService: RedisService,
    ) { }

    private ensureDevAccess() {
        if (process.env.NODE_ENV !== 'development') {
            throw new ForbiddenException('Health routes disabled');
        }
    }

    @Get('redis')
    async redisHealth() {
        this.ensureDevAccess();

        await this.redisService.client.set(
            'health:redis',
            'ok',
            { ex: 10 },
        );

        const value = await this.redisService.client.get('health:redis');

        return {
            service: 'redis',
            status: value === 'ok' ? 'healthy' : 'unhealthy',
        };
    }

    @Get('system')
    async systemHealth() {
        this.ensureDevAccess();

        return {
            service: 'system',
            status: 'healthy',
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('postgres')
    async postgresHealth() {
        this.ensureDevAccess();

        return {
            service: 'postgres',
            status: 'not implemented yet',
        };
    }

    //No architecture change needed later just extend this controller
    // @Get('postgres')
    // @Get('storage')
    // @Get('queue')
    // @Get('ai')
    // @Get('vector-db')
}