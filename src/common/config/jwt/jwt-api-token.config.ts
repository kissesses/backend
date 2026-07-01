import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

export const getApiTokenJWTConfig = (): JwtModuleAsyncOptions => ({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_API_TOKENS_SECRET'),
    }),
});
