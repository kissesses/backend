import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';

import { ok, TResult } from '@common/types';
import { ROLE } from '@libs/contracts/constants';

import { API_TOKEN_JWT } from '../../api-token-jwt.constants';
import { IJWTAuthPayload } from '../../interfaces';
import { SignApiTokenCommand } from './sign-api-token.command';

@CommandHandler(SignApiTokenCommand)
export class SignApiTokenHandler implements ICommandHandler<SignApiTokenCommand, TResult<string>> {
    constructor(@Inject(API_TOKEN_JWT) private readonly jwtService: JwtService) {}

    async execute(command: SignApiTokenCommand): Promise<TResult<string>> {
        const payload: IJWTAuthPayload = {
            uuid: command.uuid,
            username: null,
            role: ROLE.API,
        };

        return ok(
            this.jwtService.sign(payload, {
                expiresIn: `${command.expireInDays}d`,
            }),
        );
    }
}
