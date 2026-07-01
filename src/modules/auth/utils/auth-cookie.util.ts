import { Response } from 'express';

const ADMIN_AUTH_COOKIE = 'access_token';
const ADMIN_AUTH_COOKIE_PATH = '/api';
const ADMIN_AUTH_COOKIE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function setAdminAuthCookie(res: Response, accessToken: string): void {
    res.cookie(ADMIN_AUTH_COOKIE, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: ADMIN_AUTH_COOKIE_PATH,
        maxAge: ADMIN_AUTH_COOKIE_MAX_AGE_MS,
    });
}

export function clearAdminAuthCookie(res: Response): void {
    res.clearCookie(ADMIN_AUTH_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: ADMIN_AUTH_COOKIE_PATH,
    });
}

export function extractAdminAuthCookie(req: { cookies?: Record<string, string> }): string | null {
    return req.cookies?.[ADMIN_AUTH_COOKIE] ?? null;
}
