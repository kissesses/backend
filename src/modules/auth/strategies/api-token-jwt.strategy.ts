import { ExtractJwt, Strategy } from 'passport-jwt';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { TypedConfigService } from '@common/config/app-config';
import { ROLE } from '@libs/contracts/constants';

import { IJWTAuthPayload } from '../interfaces';

@Injectable()
export class ApiTokenJwtStrategy extends PassportStrategy(Strategy, 'apiTokenJWT') {
    constructor(configService: TypedConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow('JWT_API_TOKENS_SECRET'),
        });
    }

    async validate(payload: IJWTAuthPayload): Promise<IJWTAuthPayload> {
        if (payload.role !== ROLE.API) {
            throw new UnauthorizedException();
        }

        return payload;
    }
}
