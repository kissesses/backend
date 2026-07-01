export const HWID_MAX_LENGTH = 128;

export function normalizeHwid(hwid: string): string {
    return hwid.trim().toLowerCase();
}
