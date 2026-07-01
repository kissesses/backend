import axios, { AxiosInstance } from 'axios';
import { createReadStream } from 'node:fs';
import FormData from 'form-data';
import { ProxyAgent } from 'proxy-agent';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IInlineKeyboard } from '@queue/notifications/telegram-bot-logger/interfaces';

import { TelegramApiError } from './telegram-api.error';

type TelegramErrorBody = {
    description?: string;
    parameters?: { retry_after?: number };
};

@Injectable()
export class TelegramApiService {
    private readonly logger = new Logger(TelegramApiService.name);
    private readonly http: AxiosInstance;

    constructor(private readonly config: ConfigService) {
        const token = this.config.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
        const apiRoot = this.config.getOrThrow<string>('TELEGRAM_BOT_API_ROOT');
        const proxy = this.config.get<string>('TELEGRAM_BOT_PROXY');
        const agent = proxy ? new ProxyAgent({ getProxyForUrl: () => proxy }) : undefined;

        this.http = axios.create({
            baseURL: `${apiRoot}/bot${token}`,
            timeout: 10_000,
            httpAgent: agent,
            httpsAgent: agent,
        });
    }

    async sendMessage(
        chatId: string,
        text: string,
        opts?: { threadId?: number; keyboard?: IInlineKeyboard[] },
    ): Promise<void> {
        const payload: Record<string, unknown> = {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
        };

        if (opts?.threadId) payload.message_thread_id = opts.threadId;

        const reply_markup = this.buildReplyMarkup(opts?.keyboard);
        if (reply_markup) payload.reply_markup = reply_markup;

        try {
            await this.http.post('/sendMessage', payload);
        } catch (error) {
            throw this.toError(error);
        }
    }

    async sendDocument(
        chatId: string,
        filePath: string,
        opts?: { threadId?: number; caption?: string },
    ): Promise<void> {
        const form = new FormData();
        form.append('chat_id', chatId);
        form.append('document', createReadStream(filePath));

        if (opts?.threadId) {
            form.append('message_thread_id', String(opts.threadId));
        }

        if (opts?.caption) {
            form.append('caption', opts.caption);
            form.append('parse_mode', 'HTML');
        }

        try {
            await this.http.post('/sendDocument', form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 120_000,
            });
        } catch (error) {
            throw this.toError(error);
        }
    }

    public async healthcheck(): Promise<boolean> {
        try {
            const { data } = await this.http.get('/getMe');
            this.logger.log(
                `Telegram notifications enabled. Bot username: ${data.result?.username}`,
            );
            return data.ok === true;
        } catch (error) {
            this.logger.error(`Telegram getMe failed: ${this.toError(error).message}`);
            return false;
        }
    }

    async createForumTopic(chatId: string, name: string): Promise<number> {
        try {
            const { data } = await this.http.post('/createForumTopic', {
                chat_id: chatId,
                name,
            });

            const topicId = data?.result?.message_thread_id;
            if (typeof topicId !== 'number') {
                throw new TelegramApiError('createForumTopic returned no message_thread_id');
            }

            return topicId;
        } catch (error) {
            throw this.toError(error);
        }
    }

    private toError(error: unknown): TelegramApiError {
        if (!axios.isAxiosError(error)) {
            return new TelegramApiError(String(error));
        }

        if (!error.response) {
            return new TelegramApiError(`Network error: ${error.code ?? error.message}`);
        }

        const body = error.response.data as TelegramErrorBody;
        const retryAfter =
            (body?.parameters?.retry_after ?? Number(error.response.headers['retry-after'])) ||
            undefined;

        return new TelegramApiError(
            `Telegram API ${error.response.status}: ${body?.description ?? 'request failed'}`,
            retryAfter,
        );
    }

    private buildReplyMarkup(keyboard?: IInlineKeyboard[]) {
        if (!keyboard?.length) return undefined;

        return {
            inline_keyboard: keyboard.map((item) => [
                {
                    text: item.text,
                    url: item.url,
                    ...(item.customEmoji?.trim() && /^\d+$/.test(item.customEmoji.trim())
                        ? { icon_custom_emoji_id: item.customEmoji.trim() }
                        : {}),
                    ...(item.style && { style: item.style }),
                },
            ]),
        };
    }
}
