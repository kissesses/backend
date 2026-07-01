import { z } from 'zod';

export const HWID_MAX_LENGTH = 128;

export function normalizeHwidValue(hwid: string): string {
    return hwid.trim().toLowerCase();
}

export const HwidValueSchema = z
    .string()
    .min(1)
    .max(HWID_MAX_LENGTH)
    .transform(normalizeHwidValue);
