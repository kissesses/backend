// init: 0c6711a63dc2571a9b7a69a5ae00219be616ac47d38f4c6e02caff8b3c7315b4
// prev: 7fc425120da84b74dc56832b3058c775f5595e65e690bf97668ff4819c662127
// next: (updated when settings.disableSubscriptionAccessByPath default added)

export const PREV_SRR_CONFIG_HASH =
    '7fc425120da84b74dc56832b3058c775f5595e65e690bf97668ff4819c662127';

export const SRR_DEFAULT_CONFIG = {
    version: '1',
    settings: {
        disableSubscriptionAccessByPath: true,
    },
    rules: [
        {
            name: 'Browser Subscription',
            description: 'System critical: do not delete or disable this rule.',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'accept',
                    operator: 'CONTAINS',
                    value: 'text/html',
                    caseSensitive: true,
                },
            ],
            responseType: 'BROWSER',
        },
        {
            name: 'Mihomo Clients',
            description: 'Response with generated YAML config (Mihomo Template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^(?:flclash|flowvy|murge|mihomo|prizrak-box|koala-clash|clash(?:-verge|-nyanpasu|x meta|[-.]?meta))',
                    caseSensitive: false,
                },
            ],
            responseType: 'MIHOMO',
        },
        {
            name: 'Stash (iOS, macOS)',
            description: 'Response with generated YAML config (Stash Template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^stash',
                    caseSensitive: false,
                },
            ],
            responseType: 'STASH',
        },
        {
            name: 'Sing-box clients',
            description: 'Response with generated JSON config (Singbox template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^sfa|sfi|sfm|sft|karing|singbox|inhive',
                    caseSensitive: false,
                },
            ],
            responseType: 'SINGBOX',
        },
        {
            name: 'Clash Core Clients',
            description: 'Response with generated YAML config (Clash Template)',
            enabled: true,
            operator: 'AND',
            conditions: [
                {
                    headerName: 'user-agent',
                    operator: 'REGEX',
                    value: '^clash',
                    caseSensitive: false,
                },
            ],
            responseType: 'CLASH',
        },
        {
            name: 'Fallback Base64',
            description: 'System critical: do not delete or disable this rule.',
            enabled: true,
            operator: 'AND',
            conditions: [],
            responseType: 'XRAY_BASE64',
        },
    ],
};
