import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { TypedConfigService } from '@common/config/app-config';

import { extractAdminAuthCookie } from '../utils/auth-cookie.util';
import { IJWTAuthPayload } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'registeredUserJWT') {
    constructor(configService: TypedConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request) => extractAdminAuthCookie(request as { cookies?: Record<string, string> }),
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow('JWT_AUTH_SECRET'),
        });
    }

    async validate(JWTPrivatePayload: IJWTAuthPayload): Promise<IJWTAuthPayload> {
        return JWTPrivatePayload;
    }
}
