export function serializeSqlValue(value: unknown): unknown {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'bigint') {
        return value.toString();
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (Buffer.isBuffer(value)) {
        return value.toString('base64');
    }

    if (Array.isArray(value)) {
        return value.map(serializeSqlValue);
    }

    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
                key,
                serializeSqlValue(entry),
            ]),
        );
    }

    return value;
}

export function serializeSqlRows(
    rows: Record<string, unknown>[],
): Record<string, unknown>[] {
    return rows.map((row) => serializeSqlValue(row) as Record<string, unknown>);
}
