import { createHash } from 'node:crypto';

export type SqlClassification = 'read' | 'confirmation_required' | 'forbidden';

export interface SqlAnalysis {
    classification: SqlClassification;
    operation: string | null;
    normalizedSql: string;
    sqlHash: string;
}

export const MAX_QUERY_ROWS = 1_000;
export const QUERY_STATEMENT_TIMEOUT_MS = 30_000;

const FORBIDDEN_OPERATIONS =
    /\b(DROP|CREATE|ALTER|GRANT|REVOKE|INSERT|COPY|CALL|DO\s+\$\$|SET\s+ROLE|RESET\s+ROLE|pg_sleep\s*\()/i;

const DANGEROUS_SQL_FUNCTIONS =
    /\b(pg_read_file|pg_read_binary_file|pg_ls_dir|pg_stat_file|pg_terminate_backend|pg_cancel_backend|lo_import|lo_export|dblink)\s*\(/i;

const SELECT_INTO = /^\s*SELECT\b[\s\S]*\bINTO\b/i;

const READ_START = /^(SELECT|EXPLAIN|SHOW|TABLE|WITH)\b/i;

const CONFIRMATION_PATTERNS: Array<{ operation: string; pattern: RegExp }> = [
    { operation: 'VACUUM', pattern: /\bVACUUM\b/i },
    { operation: 'TRUNCATE', pattern: /\bTRUNCATE\b/i },
    { operation: 'DELETE', pattern: /\bDELETE\b/i },
    {
        operation: 'UPDATE',
        pattern: /(?<!FOR\s)\bUPDATE\b/i,
    },
];

export function normalizeSql(sql: string): string {
    return sql.trim().replace(/;\s*$/u, '');
}

export function stripSqlComments(sql: string): string {
    return sql
        .replace(/--.*$/gmu, '')
        .replace(/\/\*[\s\S]*?\*\//gu, '')
        .trim();
}

export function stripDollarQuotedStrings(sql: string): string {
    return sql.replace(/\$([A-Za-z_]*)\$[\s\S]*?\$\1\$/g, "''");
}

export function stripStringLiterals(sql: string): string {
    return stripDollarQuotedStrings(sql)
        .replace(/'(?:''|[^'])*'/gu, "''")
        .replace(/"(?:''|[^"])*"/gu, '""');
}

export function prepareSqlForAnalysis(sql: string): string {
    return stripStringLiterals(stripSqlComments(sql));
}

export function containsStatementDelimiter(sql: string): boolean {
    return prepareSqlForAnalysis(sql).includes(';');
}

export function hashSql(sql: string): string {
    return createHash('sha256').update(sql).digest('hex');
}

export function isVacuumQuery(analysis: SqlAnalysis): boolean {
    return analysis.operation === 'VACUUM';
}

export function analyzeSql(sql: string): SqlAnalysis {
    const normalizedSql = normalizeSql(sql);
    const sqlHash = hashSql(normalizedSql);

    if (!normalizedSql) {
        return forbiddenResult(normalizedSql, sqlHash);
    }

    if (containsStatementDelimiter(normalizedSql)) {
        return forbiddenResult(normalizedSql, sqlHash);
    }

    const forAnalysis = prepareSqlForAnalysis(normalizedSql);

    if (!forAnalysis) {
        return forbiddenResult(normalizedSql, sqlHash);
    }

    if (FORBIDDEN_OPERATIONS.test(forAnalysis)) {
        return forbiddenResult(normalizedSql, sqlHash);
    }

    if (DANGEROUS_SQL_FUNCTIONS.test(forAnalysis)) {
        return forbiddenResult(normalizedSql, sqlHash);
    }

    if (SELECT_INTO.test(forAnalysis)) {
        return forbiddenResult(normalizedSql, sqlHash);
    }

    for (const { operation, pattern } of CONFIRMATION_PATTERNS) {
        if (pattern.test(forAnalysis)) {
            return {
                classification: 'confirmation_required',
                operation,
                normalizedSql,
                sqlHash,
            };
        }
    }

    if (READ_START.test(forAnalysis)) {
        return {
            classification: 'read',
            operation: null,
            normalizedSql,
            sqlHash,
        };
    }

    return forbiddenResult(normalizedSql, sqlHash);
}

export function requiresTelegramConfirmation(analysis: SqlAnalysis): boolean {
    return analysis.classification === 'confirmation_required';
}

function forbiddenResult(normalizedSql: string, sqlHash: string): SqlAnalysis {
    return {
        classification: 'forbidden',
        operation: null,
        normalizedSql,
        sqlHash,
    };
}
