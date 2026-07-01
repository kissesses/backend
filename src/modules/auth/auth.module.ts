import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';

import { getJWTConfig } from '@common/config/jwt/jwt.config';

import { DatabaseManagementModule } from '@modules/database-management/database-management.module';
import { PostgresManagementModule } from '@modules/postgres-management/postgres-management.module';

import { ApiTokenJwtModule } from './api-token-jwt.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { COMMANDS } from './commands';
import { InjectRemnawaveSettingsMiddleware } from './middlewares/inject-remnawave-settings';
import { ApiTokenJwtStrategy, JwtStrategy } from './strategies';

@Module({
    imports: [
        CqrsModule,
        JwtModule.registerAsync(getJWTConfig()),
        ApiTokenJwtModule,
        HttpModule,
        forwardRef(() => DatabaseManagementModule),
        forwardRef(() => PostgresManagementModule),
    ],
    controllers: [AuthController],
    providers: [JwtStrategy, ApiTokenJwtStrategy, AuthService, ...COMMANDS],
})
export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(InjectRemnawaveSettingsMiddleware).forRoutes(AuthController);
    }
}
