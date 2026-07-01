import {
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { ROLE } from '@libs/contracts/constants';
import { ERRORS } from '@libs/contracts/constants/errors';

import { IJWTAuthPayload } from '@modules/auth/interfaces';

import { PostgresManagementGateService } from '@modules/postgres-management/postgres-management-gate.service';

@Injectable()
export class PostgresManagementElevationGuard {
    constructor(private readonly gateService: PostgresManagementGateService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<{ user?: IJWTAuthPayload }>();
        const user = request.user;

        if (!user?.uuid || user.role !== ROLE.ADMIN) {
            throw new UnauthorizedException();
        }

        const isElevated = await this.gateService.isElevated(user.uuid);

        if (!isElevated) {
            throw new ForbiddenException(ERRORS.POSTGRES_MANAGEMENT_ELEVATION_REQUIRED.message);
        }

        return true;
    }
}
