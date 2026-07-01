import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { COMMANDS } from './commands';
import { BlockedHwidsConverter } from './blocked-hwids.converter';
import { HwidUserDevicesController } from './hwid-user-devices.controller';
import { HwidUserDevicesConverter } from './hwid-user-devices.converter';
import { HwidUserDevicesService } from './hwid-user-devices.service';
import { QUERIES } from './queries';
import { BlockedHwidsRepository } from './repositories/blocked-hwids.repository';
import { HwidUserDevicesRepository } from './repositories/hwid-user-devices.repository';

@Module({
    imports: [CqrsModule],
    controllers: [HwidUserDevicesController],
    providers: [
        HwidUserDevicesRepository,
        BlockedHwidsRepository,
        HwidUserDevicesConverter,
        BlockedHwidsConverter,
        HwidUserDevicesService,
        ...COMMANDS,
        ...QUERIES,
    ],
})
export class HwidUserDevicesModule {}
