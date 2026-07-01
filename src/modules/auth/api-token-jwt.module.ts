import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { getApiTokenJWTConfig } from '@common/config/jwt/jwt-api-token.config';

import { API_TOKEN_JWT } from './api-token-jwt.constants';

@Module({
    imports: [
        JwtModule.registerAsync({
            ...getApiTokenJWTConfig(),
            global: false,
        }),
    ],
    providers: [
        {
            provide: API_TOKEN_JWT,
            useExisting: JwtService,
        },
    ],
    exports: [API_TOKEN_JWT],
})
export class ApiTokenJwtModule {}
