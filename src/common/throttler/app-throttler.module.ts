import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
    imports: [
        ThrottlerModule.forRoot([
            {
                name: 'auth',
                ttl: 60_000,
                limit: 10,
            },
            {
                name: 'subscription',
                ttl: 60_000,
                limit: 60,
            },
        ]),
    ],
    exports: [ThrottlerModule],
})
export class AppThrottlerModule {}
