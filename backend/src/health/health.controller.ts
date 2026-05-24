import {
    Controller,
    Get,
    ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

import { RedisService } from '../common/redis/redis.service';

@Controller('health')
export class HealthController {
    constructor(
        private readonly redisService: RedisService,
        @InjectDataSource() private readonly dataSource: DataSource,
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

        try {
            await this.dataSource.query('SELECT 1');
            return {
                service: 'postgres',
                status: 'healthy',
            };
        } catch (error) {
            return {
                service: 'postgres',
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    //No architecture change needed later just extend this controller
    // @Get('postgres')
    // @Get('storage')
    // @Get('queue')
    // @Get('ai')
    // @Get('vector-db')
}