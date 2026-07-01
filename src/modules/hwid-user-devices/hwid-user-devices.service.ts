import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { fail, ok, TResult } from '@common/types';
import { normalizeHwid } from '@common/utils/normalize-hwid';
import {
    BlockHwidCommand,
    GetAllHwidDevicesCommand,
    GetBlockedHwidsCommand,
} from '@libs/contracts/commands';
import { ERRORS, EVENTS } from '@libs/contracts/constants';
import { THwidSettings } from '@libs/contracts/models';

import { UserHwidDeviceEvent } from '@integration-modules/notifications/interfaces';

import { GetCachedExternalSquadSettingsQuery } from '@modules/external-squads/queries/get-cached-external-squad-settings';
import { GetCachedSubscriptionSettingsQuery } from '@modules/subscription-settings/queries/get-cached-subscrtipion-settings';
import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';

import { CreateUserHwidDeviceRequestDto } from './dtos';
import { BlockedHwidEntity } from './entities/blocked-hwid.entity';
import { HwidUserDeviceEntity } from './entities/hwid-user-device.entity';
import { GetHwidDevicesStatsResponseModel, GetTopUsersByHwidDevicesResponseModel } from './models';
import { BlockedHwidsRepository } from './repositories/blocked-hwids.repository';
import { HwidUserDevicesRepository } from './repositories/hwid-user-devices.repository';
import { CheckHwidBlockedQuery } from './queries/check-hwid-blocked/check-hwid-blocked.query';

@Injectable()
export class HwidUserDevicesService {
    private readonly logger = new Logger(HwidUserDevicesService.name);

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly hwidUserDevicesRepository: HwidUserDevicesRepository,
        private readonly blockedHwidsRepository: BlockedHwidsRepository,
        private readonly queryBus: QueryBus,
    ) {}

    public async createUserHwidDevice(
        dto: CreateUserHwidDeviceRequestDto,
    ): Promise<TResult<HwidUserDeviceEntity[]>> {
        try {
            const hwid = normalizeHwid(dto.hwid);

            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: dto.userUuid,
                    },
                    {
                        activeInternalSquads: false,
                    },
                ),
            );

            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const blockedResult = await this.queryBus.execute(new CheckHwidBlockedQuery(hwid));
            if (!blockedResult.isOk || blockedResult.response.isBlocked) {
                return fail(ERRORS.HWID_IS_BLOCKED);
            }

            const isDeviceExists = await this.hwidUserDevicesRepository.checkHwidExists(
                hwid,
                user.response.tId,
            );

            if (isDeviceExists) {
                return fail(ERRORS.USER_HWID_DEVICE_ALREADY_EXISTS);
            }

            let hwidSettings: THwidSettings | undefined;

            const subscrtipionSettings = await this.queryBus.execute(
                new GetCachedSubscriptionSettingsQuery(),
            );

            if (!subscrtipionSettings) {
                return fail(ERRORS.SUBSCRIPTION_SETTINGS_NOT_FOUND);
            }

            if (subscrtipionSettings.hwidSettings.enabled) {
                hwidSettings = subscrtipionSettings.hwidSettings;
            }

            if (user.response.externalSquadUuid) {
                const externalSquadSettings = await this.queryBus.execute(
                    new GetCachedExternalSquadSettingsQuery(user.response.externalSquadUuid),
                );

                if (externalSquadSettings && externalSquadSettings.hwidSettings) {
                    hwidSettings = externalSquadSettings.hwidSettings;
                }
            }

            if (hwidSettings && hwidSettings.enabled) {
                const count = await this.hwidUserDevicesRepository.countByUserId(user.response.tId);

                const deviceLimit =
                    user.response.hwidDeviceLimit ?? hwidSettings.fallbackDeviceLimit;

                if (count >= deviceLimit) {
                    return fail(ERRORS.USER_HWID_DEVICE_LIMIT_REACHED);
                }
            }

            const result = await this.hwidUserDevicesRepository.create(
                new HwidUserDeviceEntity({
                    hwid,
                    userId: user.response.tId,
                    platform: dto.platform,
                    osVersion: dto.osVersion,
                    deviceModel: dto.deviceModel,
                    userAgent: dto.userAgent,
                    requestIp: dto.requestIp,
                }),
            );

            this.eventEmitter.emit(
                EVENTS.USER_HWID_DEVICES.ADDED,
                new UserHwidDeviceEvent(user.response, result, EVENTS.USER_HWID_DEVICES.ADDED),
            );

            const userHwidDevices = await this.hwidUserDevicesRepository.findByCriteria({
                userId: user.response.tId,
            });

            return ok(userHwidDevices);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.CREATE_HWID_USER_DEVICE_ERROR);
        }
    }

    public async getUserHwidDevices(userUuid: string): Promise<TResult<HwidUserDeviceEntity[]>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: userUuid,
                    },
                    {
                        activeInternalSquads: false,
                    },
                ),
            );

            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const userHwidDevices = await this.hwidUserDevicesRepository.findByCriteria({
                userId: user.response.tId,
            });

            return ok(userHwidDevices);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_USER_HWID_DEVICES_ERROR);
        }
    }

    public async deleteUserHwidDevice(
        hwid: string,
        userUuid: string,
    ): Promise<TResult<HwidUserDeviceEntity[]>> {
        try {
            const normalizedHwid = normalizeHwid(hwid);

            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: userUuid,
                    },
                    {
                        activeInternalSquads: false,
                    },
                ),
            );

            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            const hwidDevice = await this.hwidUserDevicesRepository.findFirstByCriteria({
                hwid: normalizedHwid,
                userId: user.response.tId,
            });

            if (!hwidDevice) {
                return fail(ERRORS.HWID_DEVICE_NOT_FOUND);
            }

            await this.hwidUserDevicesRepository.deleteByHwidAndUserId(
                normalizedHwid,
                user.response.tId,
            );

            this.eventEmitter.emit(
                EVENTS.USER_HWID_DEVICES.DELETED,
                new UserHwidDeviceEvent(
                    user.response,
                    hwidDevice,
                    EVENTS.USER_HWID_DEVICES.DELETED,
                ),
            );

            const userHwidDevices = await this.hwidUserDevicesRepository.findByCriteria({
                userId: user.response.tId,
            });

            return ok(userHwidDevices);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_HWID_USER_DEVICE_ERROR);
        }
    }

    public async deleteAllUserHwidDevices(
        userUuid: string,
    ): Promise<TResult<HwidUserDeviceEntity[]>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: userUuid,
                    },
                    {
                        activeInternalSquads: false,
                    },
                ),
            );

            if (!user.isOk) {
                return fail(ERRORS.USER_NOT_FOUND);
            }

            await this.hwidUserDevicesRepository.deleteByUserId(user.response.tId);

            const userHwidDevices = await this.hwidUserDevicesRepository.findByCriteria({
                userId: user.response.tId,
            });

            return ok(userHwidDevices);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.DELETE_HWID_USER_DEVICES_ERROR);
        }
    }

    public async getAllHwidDevices(dto: GetAllHwidDevicesCommand.RequestQuery): Promise<
        TResult<{
            total: number;
            devices: HwidUserDeviceEntity[];
        }>
    > {
        try {
            const [devices, total] = await this.hwidUserDevicesRepository.getAllHwidDevices(dto);

            return ok({ devices, total });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_ALL_HWID_DEVICES_ERROR);
        }
    }

    public async getHwidDevicesStats(): Promise<TResult<GetHwidDevicesStatsResponseModel>> {
        try {
            const stats = await this.hwidUserDevicesRepository.getHwidDevicesStats();

            return ok(
                new GetHwidDevicesStatsResponseModel({
                    byPlatform: stats.byPlatform,
                    stats: stats.stats,
                }),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_HWID_DEVICES_STATS_ERROR);
        }
    }

    public async getTopUsersByHwidDevices(dto: {
        start: number;
        size: number;
    }): Promise<TResult<GetTopUsersByHwidDevicesResponseModel>> {
        try {
            const result = await this.hwidUserDevicesRepository.getTopUsersByHwidDevices(dto);

            return ok(
                new GetTopUsersByHwidDevicesResponseModel({
                    users: result.users,
                    total: result.total,
                }),
            );
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.INTERNAL_SERVER_ERROR);
        }
    }

    public async getBlockedHwids(
        dto: GetBlockedHwidsCommand.RequestQuery,
    ): Promise<TResult<{ total: number; blocked: BlockedHwidEntity[] }>> {
        try {
            const result = await this.blockedHwidsRepository.findAll(dto);
            return ok(result);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_BLOCKED_HWIDS_ERROR);
        }
    }

    public async blockHwid(
        dto: BlockHwidCommand.Request,
        blockedBy: string,
    ): Promise<TResult<BlockedHwidEntity>> {
        try {
            const hwid = normalizeHwid(dto.hwid);
            const existing = await this.blockedHwidsRepository.findActiveByHwid(hwid);
            if (existing) {
                return fail(ERRORS.HWID_ALREADY_BLOCKED);
            }

            const blocked = await this.blockedHwidsRepository.upsert(
                new BlockedHwidEntity({
                    hwid,
                    reason: dto.reason ?? null,
                    blockedBy,
                    expiresAt: dto.expiresAt ?? null,
                    createdAt: new Date(),
                }),
            );

            this.logger.log(
                `[AUDIT] HWID blocked: hwid=${hwid} by=${blockedBy} reason=${dto.reason ?? ''} expiresAt=${dto.expiresAt?.toISOString() ?? 'permanent'}`,
            );

            return ok(blocked);
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.BLOCK_HWID_ERROR);
        }
    }

    public async unblockHwid(
        hwid: string,
        unblockedBy: string,
    ): Promise<TResult<{ isDeleted: boolean }>> {
        try {
            const normalizedHwid = normalizeHwid(hwid);
            const isDeleted = await this.blockedHwidsRepository.deleteByHwid(normalizedHwid);
            if (!isDeleted) {
                return fail(ERRORS.HWID_BLOCK_NOT_FOUND);
            }

            this.logger.log(`[AUDIT] HWID unblocked: hwid=${normalizedHwid} by=${unblockedBy}`);

            return ok({ isDeleted: true });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.UNBLOCK_HWID_ERROR);
        }
    }

    public async checkHwidBlockedStatus(
        hwid: string,
    ): Promise<TResult<{ isBlocked: boolean }>> {
        return this.queryBus.execute(new CheckHwidBlockedQuery(normalizeHwid(hwid)));
    }

    public async getDevicesByHwid(
        hwid: string,
    ): Promise<TResult<{ total: number; devices: HwidUserDeviceEntity[] }>> {
        try {
            const devices = await this.hwidUserDevicesRepository.findByCriteria({
                hwid: normalizeHwid(hwid),
            });
            return ok({ total: devices.length, devices });
        } catch (error) {
            this.logger.error(error);
            return fail(ERRORS.GET_DEVICES_BY_HWID_ERROR);
        }
    }
}
