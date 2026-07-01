import {
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { ROLE } from '@libs/contracts/constants';
import { ERRORS } from '@libs/contracts/constants/errors';

import { IJWTAuthPayload } from '@modules/auth/interfaces';

import { DatabaseManagementGateService } from '@modules/database-management/database-management-gate.service';

@Injectable()
export class DatabaseManagementElevationGuard {
    constructor(private readonly gateService: DatabaseManagementGateService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<{ user?: IJWTAuthPayload }>();
        const user = request.user;

        if (!user?.uuid || user.role !== ROLE.ADMIN) {
            throw new UnauthorizedException();
        }

        const isElevated = await this.gateService.isElevated(user.uuid);

        if (!isElevated) {
            throw new ForbiddenException(ERRORS.DATABASE_MANAGEMENT_ELEVATION_REQUIRED.message);
        }

        return true;
    }
}
